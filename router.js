'use strict';

const admin = require('firebase-admin');
const express = require('express');
const { transaction, NotFoundError } = require('objection');
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

function injectUserIdInTags(body) {
  if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
    if (Array.isArray(body.tags)) {
      body.tags.forEach((tag, i) => {
        body.tags[i].user_id = body.user_id;
      });
    } else if (typeof body.tags === 'object') {
      body.tags.user_id = body.user_id;
    }
  }
}

function injectUserIdInTasks(req) {
  if (Object.prototype.hasOwnProperty.call(req.body, 'tasks')) {
    if (Array.isArray(req.body.tasks)) {
      req.body.tasks.forEach((task, i) => {
        req.body.tasks[i].user_id = req.body.user_id;
        injectUserIdInTags(req.body.tasks[i]);
      });
    } else if (typeof req.body.tasks === 'object') {
      req.body.tasks.user_id = req.body.user_id;
    }
  }
}

function stripIds(objectArray) {
  objectArray.forEach((item) => {
    delete item.id;
  });
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

// Auth -----------------------------------------------------------------------

router.all('*', authenticate, loadUser);

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

router.put('/tasks/:taskId', async (req, res, next) => {
  req.body.id = req.params.taskId;
  injectUserIdInTags(req.body);

  let exists = true;

  try {
    await Task.query()
      .where('id', req.body.id)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();
  } catch (err) {
    if (err instanceof NotFoundError) {
      exists = false;
    } else {
      next(err);
    }
  }

  let trx;

  if (exists) { // update
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
  } else { // create
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

router.put('/tags/:tagId', async (req, res, next) => {
  req.body.id = req.params.tagId;

  let exists = true;

  try {
    await Tag.query()
      .where('id', req.body.id)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();
  } catch (err) {
    if (err instanceof NotFoundError) {
      exists = false;
    } else {
      next(err);
    }
  }

  if (exists) { // update
    try {
      const updatedTag = await Tag.query()
        .patch(req.body)
        .where('id', req.body.id)
        .andWhere('user_id', req.user_id)
        .returning('*')
        .first()
        .throwIfNotFound();

      res.json(updatedTag);
    } catch (err) {
      next(err);
    }
  } else { // create
    try {
      const newTag = await Tag.query().insert(req.body).returning('*');

      res.json(newTag);
    } catch (err) {
      next(err);
    }
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

// Full data routes -----------------------------------------------------------

router.post('/', async (req, res, next) => {
  injectUserIdInTags(req.body);
  injectUserIdInTasks(req);
  stripIds(req.body.tasks);
  stripIds(req.body.tags);

  let trx;

  try {
    trx = await transaction.start(Task.knex());

    // delete existing tags
    await Tag.query(trx)
      .delete()
      .where('user_id', req.user_id);

    // delete existing tasks
    await Task.query(trx)
      .delete()
      .where('user_id', req.user_id);

    // insert all tags
    const tags = await Tag.query(trx)
      .insert(req.body.tags)
      .returning('*');

    // insert all tasks
    const tasks = await Task.query(trx)
      .insertGraph(req.body.tasks, { relate: true })
      .returning('*');

    await trx.commit();
    res.status(201).json({ tasks, tags });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

module.exports = router;
