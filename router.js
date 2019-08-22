'use strict';

const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
const tagRoutes = require('./routes/tagRoutes');
const fullDataRoutes = require('./routes/fullDataRoutes');
const userQueries = require('./queries/userQueries');

const router = express.Router();

// Helper functions -----------------------------------------------------------

async function loadUser(req, res, next) {
  let user;
  try {
    user = await userQueries.getByAuthServerId(req.auth_server_id);

    // user doesn't exist in DB yet, create
    if (!user) {
      user = await userQueries.create({ auth_server_id: req.auth_server_id });
    }

    req.user_id = user.id;
    req.body.user_id = user.id;

    next();
  } catch (err) {
    next(err);
  }
}

// Auth -----------------------------------------------------------------------

router.all('*', loadUser);

// Routes ---------------------------------------------------------------------

router.use(taskRoutes);
router.use(tagRoutes);
router.use(fullDataRoutes);

module.exports = router;
