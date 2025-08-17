require('dotenv').config(); // Load secrets (like api keys)
const express = require('express'); // Tool for server
const admin = require('firebase-admin'); // Tool for Firebase data
const app = express(); // Start the mailbox
app.use(express.json()); // Understand JSON letters

// Login with code endpoint
app.post('/login-with-code', async (req, res) => {
  const { code } = req.body; // Get code from app
  try {
    const snapshot = await db.collection('customers').where('affiliateCode', '==', code).get(); // Check if code exists
    if (snapshot.empty) return res.status(400).json({ error: 'Invalid code' });
    const data = snapshot.docs[0].data(); // Get balance/earnings
    res.json({ success: true, balance: data.accountBalance, commission: data.commissionEarned }); // Send back
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// For notifications (if using OneSignal or Twilio)
app.post('/send-notification', async (req, res) => {
  const { code, amount } = req.body; // Get from web update
  // Use Twilio or OneSignal to send
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on 3000')); // Start listening