'use strict';

const express = require('express');
const routes = require('./routes');

const app = express();
const port = process.evn.PORT || 3000;

app.listen(port, () => console.log(`Express server is listening on port ${port}`));
