const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'obsidian-circle-393f2.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
