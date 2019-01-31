'use strict';

const { BaseModel } = require('./BaseModel');

class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['auth_server_id'],

      properties: {
        id: { type: 'integer' },
        auth_server_id: { type: 'string', maxLength: 255 },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.HasManyRelation,
        modelClass: `${__dirname}/Task`,
        join: {
          from: 'users.id',
          to: 'tasks.user_id',
        },
      },

      tags: {
        relation: BaseModel.HasManyRelation,
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
