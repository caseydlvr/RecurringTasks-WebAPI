'use strict';

const { Model } = require('objection');

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
        'start_date',
        'repeating',
        'notification_option'],

      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        duration: { type: 'integer', minimum: 1, maximum: 999 },
        // duration_unit: { type: 'string', pattern: '^(day|week|month|year)$' },
        duration_unit: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
        start_date: { type: 'date' },
        repeating: { type: 'boolean' },
        notification_option: { type: 'string', enum: ['never', 'overdue', 'overdue_due'] },
      },
    };
  }
}

module.exports = Task;
