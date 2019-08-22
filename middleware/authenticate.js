const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

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

module.exports = authenticate;
