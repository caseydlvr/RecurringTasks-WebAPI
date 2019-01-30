'use strict';

const express = require('express');
const { transaction } = require('objection');
const User = require('./models/User');
const Task = require('./models/Task');
const Tag = require('./models/Tag');

const router = express.Router();

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

// Param middleware -----------------------------------------------------------

router.param('userId', async (req, res, next, id) => {
  req.body.user_id = parseInt(id, 10);

  try {
    await User.query()
      .where('id', req.body.user_id)
      .throwIfNotFound();

    next();
  } catch (err) {
    next(err);
  }
});

// Task routes ----------------------------------------------------------------

router.get('/:userId/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.query()
      .where('user_id', req.params.userId)
      .eager('tags');

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/:userId/tasks/:taskId', async (req, res, next) => {
  try {
    const task = await Task.query()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId)
      .eager('tags')
      .first()
      .throwIfNotFound();

    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/:userId/tasks', async (req, res, next) => {
  injectUserIdInTags(req);

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

router.post('/:userId/tasks/:taskId/complete', async (req, res, next) => {
  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const task = await Task.query(trx)
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId)
      .eager('tags')
      .first()
      .throwIfNotFound();

    await Task.query(trx)
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId)
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

router.patch('/:userId/tasks/:taskId', async (req, res, next) => {
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

router.delete('/:userId/tasks/:taskId', async (req, res, next) => {
  try {
    await Task.query()
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId)
      .throwIfNotFound();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// Tag routes -----------------------------------------------------------------

router.get('/:userId/tags', async (req, res, next) => {
  try {
    const tags = await Tag.query().where('user_id', req.params.userId);

    res.json(tags);
  } catch (err) {
    next(err);
  }
});

router.post('/:userId/tags', async (req, res, next) => {
  try {
    const newTag = await Tag.query().insert(req.body).returning('*');

    res.json(newTag);
  } catch (err) {
    next(err);
  }
});

router.patch('/:userId/tags/:tagId', async (req, res, next) => {
  try {
    const updatedTag = await Tag.query()
      .patch(req.body)
      .where('id', req.params.tagId)
      .andWhere('user_id', req.params.userId)
      .returning('*')
      .first()
      .throwIfNotFound();

    res.json(updatedTag);
  } catch (err) {
    next(err);
  }
});

router.delete('/:userId/tags/:tagId', async (req, res, next) => {
  try {
    await Tag.query()
      .delete()
      .where('id', req.params.tagId)
      .andWhere('user_id', req.params.userId)
      .throwIfNotFound();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
