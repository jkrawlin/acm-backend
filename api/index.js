require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Converts \n to actual newlines
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(express.json());

// Your routes here (unchanged)
app.post('/api/login-with-code', async (req, res) => {
  const { code } = req.body;
  try {
    const snapshot = await db.collection('customers').where('affiliateCode', '==', code).get();
    if (snapshot.empty) return res.status(400).json({ error: 'Invalid code' });
    const data = snapshot.docs[0].data();
    res.json({ success: true, balance: data.accountBalance, commission: data.commissionEarned });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/send-notification', async (req, res) => {
  const { code, amount } = req.body;
  res.json({ success: true });
});

module.exports = app;