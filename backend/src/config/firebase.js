const admin = require('firebase-admin');
const path = require('path');

let db;

function initFirebase() {
  if (admin.apps.length) return admin.firestore();

  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // From environment variable (production)
    credential = admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    );
  } else {
    // From JSON file in project root (local dev)
    const serviceAccount = require(
      path.join(__dirname, '../../firebase-service-account.json')
    );
    credential = admin.credential.cert(serviceAccount);
  }

  admin.initializeApp({ credential });
  db = admin.firestore();
  console.log('✅ Firebase initialized');
  return db;
}

function getDb() {
  if (!db) db = initFirebase();
  return db;
}

module.exports = { initFirebase, getDb };
