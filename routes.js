'use strict';

const express = require('express');

const router = express.Router();


// Task routes ----------------------------------------------------------------

router.get('/:userId/tasks', (req, res, next) => {

});

router.get('/:userId/tasks/:taskId', (req, res, next) => {

});

router.post('/:userId/tasks', (req, res, next) => {

});

router.post('/:userId/tasks/:taskId/complete', (req, res, next) => {

});

router.patch('/:userId/tasks/:taskId', (req, res, next) => {

});

router.delete('/:userId/tasks/:taskId', (req, res, next) => {

});

// Tag routes -----------------------------------------------------------------

router.get('/:userId/tags', (req, res, next) => {

});

router.post('/:userId/tags', (req, res, next) => {

});

router.patch('/:userId/tags/:tagId', (req, res, next) => {

});

router.delete('/:userId/tags/:tagId', (req, res, next) => {

});

module.exports = router;
