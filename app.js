'use strict';

const express = require('express');
const routes = require('./routes');
const bodyParser = require('body-parser');
const Knex = require('knex');
const knexConfig = require('./knexfile');
const { Model } = require('objection');

const app = express();
const port = process.evn.PORT || 3000;
const knex = Knex(knexConfig.development);

app.listen(port, () => console.log(`Express server is listening on port ${port}`));
