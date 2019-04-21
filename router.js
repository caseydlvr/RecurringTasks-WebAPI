'use strict';

const admin = require('firebase-admin');
const express = require('express');
const { transaction } = require('objection');
const User = require('./models/User');
const Task = require('./models/Task');
const Tag = require('./models/Tag');

const router = express.Router();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

// Helper functions -----------------------------------------------------------

function injectUserIdInTags(req) {
  if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
    if (Array.isArray(req.body.tags)) {
      req.body.tags.forEach((tag, i) => {
        req.body.tags[i].user_id = req.body.user_id;
      });
    } else if (typeof req.body.tags === 'object') {
      req.body.tags.user_id = req.body.user_id;
    }
  }
}

async function authenticate(req, res, next) {
  let token = req.get('authorization');
  if (!token || typeof token !== 'string') {
    return res.sendStatus(401);
  }

  if (token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.auth_server_id = decodedToken.uid;
    return next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

async function loadUser(req, res, next) {
  let user;
  try {
    user = await User.query()
      .where('auth_server_id', req.auth_server_id)
      .first();

    // user doesn't exist in DB yet, create
    if (!user) {
      user = await User.query()
        .insert({ auth_server_id: req.auth_server_id })
        .returning('*')
        .throwIfNotFound();
    }

    req.user_id = user.id;
    req.body.user_id = user.id;

    next();
  } catch (err) {
    next(err);
  }
}

// Auth ----------------------------------------------------------------------

router.all('*', authenticate, loadUser);

// Param middleware -----------------------------------------------------------

// abort if task doesn't exist or isn't this user's task
router.param('taskId', async (req, res, next) => {
  try {
    await Task.query()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    next();
  } catch (err) {
    next(err);
  }
});

// abort if tag doesn't exist or isn't this user's tag
router.param('tagId', async (req, res, next) => {
  try {
    await Tag.query()
      .where('id', req.params.tagId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    next();
  } catch (err) {
    next(err);
  }
});

// Task routes ----------------------------------------------------------------

router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.query()
      .where('user_id', req.user_id)
      .eager('tags');

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/tasks/:taskId', async (req, res, next) => {
  try {
    const task = await Task.query()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.user_id)
      .eager('tags')
      .first()
      .throwIfNotFound();

    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/tasks', async (req, res, next) => {
  injectUserIdInTags(req);
  delete req.body.id;

  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const newTask = await Task.query(trx)
      .allowInsert('tags')
      .insertWithRelatedAndFetch(req.body, { relate: true });

    await trx.commit();
    res.status(201).json(newTask);
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

router.post('/tasks/:taskId/complete', async (req, res, next) => {
  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const task = await Task.query(trx)
      .where('id', req.params.taskId)
      .andWhere('user_id', req.user_id)
      .eager('tags')
      .first()
      .throwIfNotFound();

    await Task.query(trx)
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    let newTask;

    if (task.repeating) {
      delete task.id;
      delete task.start_date;
      newTask = await Task.query(trx)
        .insertWithRelatedAndFetch(task, { relate: true });
    }

    await trx.commit();

    if (newTask) {
      res.status(201).json(newTask);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

router.patch('/tasks/:taskId', async (req, res, next) => {
  req.body.id = parseInt(req.params.taskId, 10);
  injectUserIdInTags(req);

  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const updatedTask = await Task.query(trx)
      .upsertGraphAndFetch(req.body, {
        relate: ['tags'],
        unrelate: ['tags'],
        noInsert: ['tags', 'users'],
        noUpdate: ['tags', 'users'],
        noDelete: ['tags', 'users'],
      })
      .eager('tags');

    await trx.commit();
    res.json(updatedTask);
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

router.delete('/tasks/:taskId', async (req, res, next) => {
  try {
    await Task.query()
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// Tag routes -----------------------------------------------------------------

router.get('/tags', async (req, res, next) => {
  try {
    const tags = await Tag.query().where('user_id', req.user_id);

    res.json(tags);
  } catch (err) {
    next(err);
  }
});

router.post('/tags', async (req, res, next) => {
  delete req.body.id;

  try {
    const newTag = await Tag.query().insert(req.body).returning('*');

    res.json(newTag);
  } catch (err) {
    next(err);
  }
});

router.patch('/tags/:tagId', async (req, res, next) => {
  delete req.body.id;

  try {
    const updatedTag = await Tag.query()
      .patch(req.body)
      .where('id', req.params.tagId)
      .andWhere('user_id', req.user_id)
      .returning('*')
      .first()
      .throwIfNotFound();

    res.json(updatedTag);
  } catch (err) {
    next(err);
  }
});

router.delete('/tags/:tagId', async (req, res, next) => {
  try {
    await Tag.query()
      .delete()
      .where('id', req.params.tagId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
