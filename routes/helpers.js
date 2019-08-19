function injectUserIdInTags(body) {
  if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
    if (Array.isArray(body.tags)) {
      body.tags.forEach((tag, i) => {
        body.tags[i].user_id = body.user_id;
      });
    } else if (typeof body.tags === 'object') {
      body.tags.user_id = body.user_id;
    }
  }
}

function injectUserIdInTasks(req) {
  if (Object.prototype.hasOwnProperty.call(req.body, 'tasks')) {
    if (Array.isArray(req.body.tasks)) {
      req.body.tasks.forEach((task, i) => {
        req.body.tasks[i].user_id = req.body.user_id;
        injectUserIdInTags(req.body.tasks[i]);
      });
    } else if (typeof req.body.tasks === 'object') {
      req.body.tasks.user_id = req.body.user_id;
    }
  }
}

function stripIds(objectArray) {
  objectArray.forEach((item) => {
    delete item.id;
  });
}

module.exports = { injectUserIdInTags, injectUserIdInTasks, stripIds };
