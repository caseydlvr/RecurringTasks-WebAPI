const express = require('express');
const { transaction } = require('objection');
const Tag = require('../models/Tag');
const Task = require('../models/Task');
const { stripIds, injectUserIdInTags, injectUserIdInTasks } = require('./helpers');

const fullDataRouter = express.Router();

fullDataRouter.post('/', async (req, res, next) => {
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

module.exports = fullDataRouter;
