'use strict';

const admin = require('firebase-admin');
const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
const tagRoutes = require('./routes/tagRoutes');
const fullDataRoutes = require('./routes/fullDataRoutes');
const userQueries = require('./queries/userQueries');

const router = express.Router();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

// Helper functions -----------------------------------------------------------

async function authenticate(req, res, next) {
  let token = req.get('authorization');
  if (!token || typeof token !== 'string') {
    return res.sendStatus(401);
  }

  if (token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.auth_server_id = decodedToken.uid;
    return next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

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

router.all('*', authenticate, loadUser);

// Routes ---------------------------------------------------------------------

router.use(taskRoutes);
router.use(tagRoutes);
router.use(fullDataRoutes);

module.exports = router;
