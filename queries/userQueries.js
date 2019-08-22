const User = require('../models/User');

const userQueries = {

  getByAuthServerId: (authServerId) => User.query()
    .where('auth_server_id', authServerId)
    .first(),

  create: (user) => User.query()
    .insert(user)
    .returning('*')
    .throwIfNotFound(),
};

module.exports = userQueries;
