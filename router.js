'use strict';

const express = require('express');
const { transaction } = require('objection');
const Task = require('./models/Task');
const Tag = require('./models/Tag');

const router = express.Router();

// Param middleware -----------------------------------------------------------

router.param('userId', (req, res, next, id) => {
  req.body.user_id = parseInt(id, 10);
  next();
});


// Task routes ----------------------------------------------------------------

router.get('/:userId/tasks', async (req, res, next) => {
  const tasks = await Task.query().where('user_id', req.params.userId);

  res.json(tasks);
});

router.get('/:userId/tasks/:taskId', async (req, res, next) => {
  const task = await Task.query()
    .where('id', req.params.taskId)
    .andWhere('user_id', req.params.userId);

  res.json(task);
});

router.post('/:userId/tasks', async (req, res, next) => {
  const newTask = await Task.query().insert(req.body);

  res.json(newTask);
});

router.post('/:userId/tasks/:taskId/complete', (req, res, next) => {

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
