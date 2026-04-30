const { admin, db } = require('../config/firebase');

async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Fetch user details from Firestore to get role/status/external_id
    // We assume the Firestore document ID IS the uid
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      // User created in Auth but not in Firestore? Rare edge case or race condition.
      // We can allow them as "guest" or fail. Fail is safer for this app.
      console.error(`User ${decoded.uid} authenticated but no Firestore record found.`);
      return res.status(401).json({ error: 'User record not found in database' });
    }

    const userData = userDoc.data();
    if (userData.status === 'banned') {
      return res.status(403).json({ error: 'Account is banned' });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      ...userData
    };
    
    next();
  } catch (err) {
    console.error('Firebase Auth Verification Failed:', err.message);
    req.user = null;
    next();
  }
}

module.exports = firebaseAuth;
