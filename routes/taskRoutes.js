const express = require('express');
const { transaction, NotFoundError } = require('objection');
const Task = require('../models/Task');
const { injectUserIdInTags } = require('./helpers');

const router = express.Router();

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

module.exports = router;
