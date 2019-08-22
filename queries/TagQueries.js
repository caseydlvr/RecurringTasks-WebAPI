const Tag = require('../models/Tag');

const TagQueries = {

  getAll: (userId) => Tag.query().where('user_id', userId),

  get:(tagId, userId) => Tag.query()
    .where('id', tagId)
    .andWhere('user_id', userId)
    .throwIfNotFound(),

  create: (tag) => Tag.query().insert(tag).returning('*'),

  update: (tag) => Tag.query()
    .patch(tag)
    .where('id', tag.id)
    .andWhere('user_id', tag.user_id)
    .returning('*')
    .first()
    .throwIfNotFound(),

  delete: (tagId, userId) => Tag.query()
    .delete()
    .where('id', tagId)
    .andWhere('user_id', userId)
    .throwIfNotFound(),
};

module.exports = TagQueries;
