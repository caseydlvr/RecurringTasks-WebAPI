'use strict';

const { Model } = require('objection');
const Tag = require('./Tag');
const User = require('./User');

class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id',
        'name',
        'duration',
        'duration_unit',
        'repeating',
        'notification_option'],

      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        duration: { type: 'integer', minimum: 1, maximum: 999 },
        duration_unit: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
        start_date: { type: 'date' },
        repeating: { type: 'boolean' },
        notification_option: { type: 'string', enum: ['never', 'overdue', 'overdue_due'] },
      },
    };
  }

  static get relationMappings() {
    return {
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: ['tasks.id', 'tasks.user_id'],
          through: {
            from: ['tasks_tags.task_id', 'tasks_tags.user_id'],
            to: ['tasks_tags.tag_id', 'tasks_tags.user_id'],
          },
          to: ['tags.id', 'tags.user_id'],
        },
      },

      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = Task;
