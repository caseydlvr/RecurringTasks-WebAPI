'use strict';

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      user: 'dev',
      password: 'Cq^5$avTE*',
      database: 'recurring_tasks',
    },
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    ssl: true,
    pool: {
      min: 2,
      max: 10,
    },
  },

};
