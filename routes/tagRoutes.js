const express = require('express');
const { NotFoundError } = require('objection');
const TagQueries = require('../queries/TagQueries');

const tagRouter = express.Router();

tagRouter.get('/tags', async (req, res, next) => {
  try {
    const tags = await TagQueries.getAll(req.user_id);

    res.json(tags);
  } catch (err) {
    next(err);
  }
});

tagRouter.put('/tags/:tagId', async (req, res, next) => {
  req.body.id = req.params.tagId;

  let exists = true;

  try {
    await TagQueries.get(req.params.tagId, req.user_id);
  } catch (err) {
    if (err instanceof NotFoundError) {
      exists = false;
    } else {
      next(err);
    }
  }

  if (exists) { // update
    try {
      const updatedTag = await TagQueries.update(req.body);

      res.json(updatedTag);
    } catch (err) {
      next(err);
    }
  } else { // create
    try {
      const newTag = await TagQueries.create(req.body);

      res.json(newTag);
    } catch (err) {
      next(err);
    }
  }
});

tagRouter.delete('/tags/:tagId', async (req, res, next) => {
  try {
    await TagQueries.delete(req.params.tagId, req.user_id);

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = tagRouter;
