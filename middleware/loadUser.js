const userQueries = require('../queries/userQueries');

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

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = loadUser;
