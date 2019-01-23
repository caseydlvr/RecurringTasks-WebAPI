'use strict';

const { Model } = require('objection');

class TaskTag extends Model {
  static get tableName() {
    return 'tasks_tags';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['task_id', 'tag_id'],

      properties: {
        task_id: { type: 'integer', minimum: 1 },
        tag_id: { type: 'integer', minimum: 1 },
      },
    };
  }
}

module.exports = TaskTag;
