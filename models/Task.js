'use strict';

const { BaseModel } = require('./BaseModel');
const Tag = require('./Tag');
const User = require('./User');

class Task extends BaseModel {
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
        id: {
          type: 'string',
          format: 'uuid',
          pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        },
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
        relation: BaseModel.ManyToManyRelation,
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
        relation: BaseModel.BelongsToOneRelation,
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
