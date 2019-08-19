const express = require('express');
const { NotFoundError } = require('objection');
const Tag = require('../models/Tag');

const router = express.Router();

router.get('/tags', async (req, res, next) => {
  try {
    const tags = await Tag.query().where('user_id', req.user_id);

    res.json(tags);
  } catch (err) {
    next(err);
  }
});

router.put('/tags/:tagId', async (req, res, next) => {
  req.body.id = req.params.tagId;

  let exists = true;

  try {
    await Tag.query()
      .where('id', req.body.id)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();
  } catch (err) {
    if (err instanceof NotFoundError) {
      exists = false;
    } else {
      next(err);
    }
  }

  if (exists) { // update
    try {
      const updatedTag = await Tag.query()
        .patch(req.body)
        .where('id', req.body.id)
        .andWhere('user_id', req.user_id)
        .returning('*')
        .first()
        .throwIfNotFound();

      res.json(updatedTag);
    } catch (err) {
      next(err);
    }
  } else { // create
    try {
      const newTag = await Tag.query().insert(req.body).returning('*');

      res.json(newTag);
    } catch (err) {
      next(err);
    }
  }
});

router.delete('/tags/:tagId', async (req, res, next) => {
  try {
    await Tag.query()
      .delete()
      .where('id', req.params.tagId)
      .andWhere('user_id', req.user_id)
      .throwIfNotFound();

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
