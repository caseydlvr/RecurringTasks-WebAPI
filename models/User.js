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

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Task`,
        join: {
          from: 'users.id',
          to: 'tasks.user_id',
        },
      },

      tags: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Tag`,
        join: {
          from: 'users.id',
          to: 'tags.user_id',
        },
      },
    };
  }
}

module.exports = User;
