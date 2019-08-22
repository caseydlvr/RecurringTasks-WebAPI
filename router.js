'use strict';

const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
const tagRoutes = require('./routes/tagRoutes');
const fullDataRoutes = require('./routes/fullDataRoutes');

const router = express.Router();

// Routes ---------------------------------------------------------------------

router.use(taskRoutes);
router.use(tagRoutes);
router.use(fullDataRoutes);

module.exports = router;
