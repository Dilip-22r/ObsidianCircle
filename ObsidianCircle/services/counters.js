const { db } = require('../config/firebase');

exports.getNext = async (name) => {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const value = doc.exists ? doc.data().value + 1 : 1;
    tx.set(ref, { value });
    return value;
  });
};
