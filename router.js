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
  const tasks = await Task.query().where('user_id', req.params.userId);

  res.json(tasks);
});

router.get('/:userId/tasks/:taskId', async (req, res, next) => {
  const [task] = await Task.query()
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId);

  if (!task) {
    next(notFoundError());
  } else {
    res.json(task);
  }
});

router.post('/:userId/tasks', async (req, res, next) => {
  const newTask = await Task.query().insert(req.body).returning('*');

  res.status(201).json(newTask);
});

router.post('/:userId/tasks/:taskId/complete', async (req, res, next) => {
  let trx;
  try {
    trx = await transaction.start(Task.knex());

    const [task] = await Task.query(trx)
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId);

    if (!task) throw notFoundError();

    const deleteCount = await Task.query(trx)
      .delete()
      .where('id', req.params.taskId)
      .andWhere('user_id', req.params.userId);

    if (deleteCount !== 1) throw new Error();

    let newTask;

    if (task.repeating) {
      delete task.id;
      delete task.start_date;
      newTask = await Task.query(trx).insert(task).returning('*');
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
  const updateCount = await Task.query()
    .patch(req.body)
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId);

  res.json(updateCount);
});

router.delete('/:userId/tasks/:taskId', async (req, res, next) => {
  const deleteCount = await Task.query()
    .delete()
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId);

  res.json(deleteCount);
});

// Tag routes -----------------------------------------------------------------

router.get('/:userId/tags', async (req, res, next) => {
  const tags = await Tag.query().where('user_id', req.params.userId);

  res.json(tags);
});

router.post('/:userId/tags', async (req, res, next) => {
  const newTag = await Tag.query().insert(req.body);

  res.json(newTag);
});

router.patch('/:userId/tags/:tagId', async (req, res, next) => {
  const updateCount = await Tag.query()
    .patch(req.body)
    .where('id', req.params.tagId)
    .andWhere('user_id', req.params.userId);

  res.json(updateCount);
});

router.delete('/:userId/tags/:tagId', async (req, res, next) => {
  const deleteCount = await Tag.query()
    .delete()
    .where('id', req.params.tagId)
    .andWhere('user_id', req.params.userId);

  res.json(deleteCount);
});

module.exports = router;
