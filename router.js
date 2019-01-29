'use strict';

const express = require('express');
const { transaction } = require('objection');
const User = require('./models/User');
const Task = require('./models/Task');
const Tag = require('./models/Tag');

const router = express.Router();

// Helper functions -----------------------------------------------------------

function notFoundError() {
  const err = new Error('Not Found');
  err.status = 404;
  return err;
}

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

  const [user] = await User.query().where('id', req.body.user_id);

  if (!user) {
    next(notFoundError());
  } else {
    next();
  }
});

// Task routes ----------------------------------------------------------------

router.get('/:userId/tasks', async (req, res, next) => {
  const tasks = await Task.query()
    .where('user_id', req.params.userId)
    .eager('tags');

  res.json(tasks);
});

router.get('/:userId/tasks/:taskId', async (req, res, next) => {
  const [task] = await Task.query()
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId)
    .eager('tags');

  if (!task) {
    next(notFoundError());
  } else {
    res.json(task);
  }
});

router.post('/:userId/tasks', async (req, res, next) => {
  injectUserIdInTags(req);

  const newTask = await Task.query()
    .allowInsert('tags')
    .insertWithRelatedAndFetch(req.body, { relate: true });

  res.status(201).json(newTask);
});

router.post('/:userId/tasks/:taskId/complete', async (req, res, next) => {
  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const [task] = await Task.query(trx)
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId)
      .eager('tags');

    if (!task) throw notFoundError();

    await Task.query(trx)
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId);

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

  const updatedTask = await Task.query()
    .upsertGraphAndFetch(req.body, {
      relate: ['tags'],
      unrelate: ['tags'],
      noInsert: ['tags', 'users'],
      noUpdate: ['tags', 'users'],
      noDelete: ['tags', 'users'],
    })
    .eager('tags');

  res.json(updatedTask);
});

router.delete('/:userId/tasks/:taskId', async (req, res, next) => {
  const deleteCount = await Task.query()
    .delete()
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId);

  if (deleteCount < 1) {
    next(notFoundError());
  } else {
    res.sendStatus(204);
  }
});

// Tag routes -----------------------------------------------------------------

router.get('/:userId/tags', async (req, res, next) => {
  const tags = await Tag.query().where('user_id', req.params.userId);

  res.json(tags);
});

router.post('/:userId/tags', async (req, res, next) => {
  const newTag = await Tag.query().insert(req.body).returning('*');

  res.json(newTag);
});

router.patch('/:userId/tags/:tagId', async (req, res, next) => {
  const [updatedTag] = await Tag.query()
    .patch(req.body)
    .where('id', req.params.tagId)
    .andWhere('user_id', req.params.userId)
    .returning('*');

  res.json(updatedTag);
});

router.delete('/:userId/tags/:tagId', async (req, res, next) => {
  await Tag.query()
    .delete()
    .where('id', req.params.tagId)
    .andWhere('user_id', req.params.userId);

  res.sendStatus(204);
});

module.exports = router;
