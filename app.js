'use strict';

const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { Model } = require('objection');
const Knex = require('knex');
const knexConfig = require('./knexfile')[env];
const authenticate = require('./middleware/authenticate');
const router = require('./router');
const { catchRouteNotFound, errorHandler } = require('./error');

const knex = Knex(knexConfig);
const app = express()
  .use(bodyParser.json())
  .use(morgan('dev'))
  .use(authenticate)
  .use(router)
  .use(catchRouteNotFound)
  .use(errorHandler)
  .set('json spaces', 2);

Model.knex(knex);

app.listen(port, () => console.log(`Express server is listening on port ${port}`));
