const { transaction } = require('objection');
const Task = require('../models/Task');

const TaskQueries = {

  getAll: (userId, trx = false) => Task.query(trx)
    .where('user_id', userId)
    .eager('tags'),

  get: (taskId, userId, trx = false) => Task.query(trx)
    .where('id', taskId)
    .andWhere('user_id', userId)
    .eager('tags')
    .first()
    .throwIfNotFound(),

  create: async (task, trx = false) => {
    try {
      if (!trx) trx = await transaction.start(Task.knex());

      const newTask = await Task.query(trx)
        .allowInsert('tags')
        .insertWithRelatedAndFetch(task, { relate: true });

      await trx.commit();

      return newTask;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  },

  update: async (task, trx = false) => {
    try {
      if (!trx) trx = await transaction.start(Task.knex());

      const updatedTask = await Task.query(trx)
        .upsertGraphAndFetch(task, {
          relate: ['tags'],
          unrelate: ['tags'],
          noInsert: ['tags', 'users'],
          noUpdate: ['tags', 'users'],
          noDelete: ['tags', 'users'],
        })
        .eager('tags');

      await trx.commit();

      return updatedTask;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  },

  delete: (taskId, userId, trx = false) => Task.query(trx)
    .delete()
    .where('id', taskId)
    .andWhere('user_id', userId)
    .throwIfNotFound(),

  complete: async (taskId, userId) => {
    let trx;

    try {
      trx = await transaction.start(Task.knex());

      const task = await TaskQueries.get(taskId, userId, trx);
      await TaskQueries.delete(taskId, userId, trx);
      let newTask = null;

      if (task.repeating) {
        delete task.id;
        delete task.start_date;
        newTask = await TaskQueries.create(task, trx);
      }

      await trx.commit();

      return newTask;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  },
};

module.exports = TaskQueries;
