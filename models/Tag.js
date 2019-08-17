'use strict';

const { BaseModel } = require('./BaseModel');

class Tag extends BaseModel {
  static get tableName() {
    return 'tags';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'name'],

      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1, maxLength: 255 },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: `${__dirname}/Task`,
        join: {
          from: ['tags.id', 'tags.user_id'],
          through: {
            from: ['tasks_tags.tag_id', 'tasks_tags.user_id'],
            to: ['tasks_tags.task_id', 'tasks_tags.user_id'],
          },
          to: ['tasks.id', 'tasks.user_id'],
        },
      },

      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'tags.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = Tag;
