require('dotenv').config(); // Load secrets
const express = require('express');
const admin = require('firebase-admin');
const app = express();
app.use(express.json());

const serviceAccount = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Login endpoint
app.post('/login-with-code', async (req, res) => {
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

// Notification endpoint
app.post('/send-notification', async (req, res) => {
  const { code, amount } = req.body;
  res.json({ success: true });
});

module.exports = app;