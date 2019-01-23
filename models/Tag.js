'use strict';

const { Model } = require('objection');

class Tag extends Model {
  static get tableName() {
    return 'tags';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'name'],

      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer', minimum: 1 },
        name: { type: 'string', minLength: 1, maxLength: 255 },
      },
    };
  }
}

module.exports = Tag;
