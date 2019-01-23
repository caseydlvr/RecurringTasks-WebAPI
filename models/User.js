'use strict';

const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',

      properties: {
        id: { type: 'integer' },
        auth_server_id: { type: 'string', maxLength: 255 },
      },
    };
  }
}

module.exports = User;
