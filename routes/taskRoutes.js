const express = require('express');
const { NotFoundError } = require('objection');
const TaskQueries = require('../queries/TaskQueries');
const { injectUserIdInTags } = require('./helpers');

const taskRouter = express.Router();

taskRouter.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await TaskQueries.getAll(req.user_id);

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

taskRouter.get('/tasks/:taskId', async (req, res, next) => {
  try {
    const task = await TaskQueries.get(req.params.taskId, req.user_id);

    res.json(task);
  } catch (err) {
    next(err);
  }
});

taskRouter.post('/tasks/:taskId/complete', async (req, res, next) => {
  try {
    const newTask = await TaskQueries.complete(req.params.taskId, req.user_id);

    if (newTask) {
      res.status(201).json(newTask);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
});

taskRouter.put('/tasks/:taskId', async (req, res, next) => {
  req.body.id = req.params.taskId;
  injectUserIdInTags(req.body);

  let exists = true;

  try {
    await TaskQueries.get(req.params.taskId, req.user_id);
  } catch (err) {
    if (err instanceof NotFoundError) {
      exists = false;
    } else {
      next(err);
    }
  }

  if (exists) { // update
    try {
      const updatedTask = await TaskQueries.update(req.body);

      res.json(updatedTask);
    } catch (err) {
      next(err);
    }
  } else { // create
    try {
      const newTask = await TaskQueries.create(req.body);

      res.status(201).json(newTask);
    } catch (err) {
      next(err);
    }
  }
});

taskRouter.delete('/tasks/:taskId', async (req, res, next) => {
  try {
    await TaskQueries.delete(req.params.taskId, req.user_id);

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = taskRouter;
