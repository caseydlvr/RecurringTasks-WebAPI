'use strict';

const { Model } = require('objection');
const { DbErrors } = require('objection-db-errors');

// Automatically wraps DB errors in objection-db-error types
class BaseModel extends DbErrors(Model) {

}

module.exports = {
  BaseModel,
};
