'use strict';

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('./knexfile')[env];
const router = require('./router');

const knex = Knex(knexConfig);
const app = express()
  .use(bodyParser.json())
  .use(morgan('dev'))
  .use(router)
  .set('json spaces', 2);

Model.knex(knex);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err); // signals there's an error
});

// Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

app.listen(port, () => console.log(`Express server is listening on port ${port}`));
