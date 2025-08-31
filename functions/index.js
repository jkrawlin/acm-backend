const functions = require("firebase-functions");
const express = require("express");
const sgMail = require("@sendgrid/mail"); // New: For SendGrid

const app = express();

const admin = require('firebase-admin'); // This is the tool to send pushes from backend

// Set up FCM with your Firebase keys (we'll add this as a secret in Vercel later)
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
app.use(express.json()); // For parsing JSON bodies

// Set SendGrid API key from Firebase config (secure)
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

async function sendPushNotification(token, commission, balance) {
  const message = {
    notification: {
      title: 'Commission Earned', // The alert title
      body: `You earned QR ${commission}! Balance: QR ${balance}` // The message text
    },
    token: token // The customer's unique push ID
  };
  try {
    await admin.messaging().send(message); // Send it!
    console.log('Push sent successfully');
  } catch (error) {
    console.error('Error sending push:', error); // Log if fails
  }
}

// Your existing /login-with-code endpoint (unchanged)
app.post("/login-with-code", async (req, res) => {
  const {code} = req.body;

  if (!code) {
    return res.status(400).json({error: "Code is required"});
  }

  try {
    // Updated: Query 'customers' collection for 'affiliateCode'
    const userDoc = await admin.firestore()
        .collection("users")
        .where("loginCode", "==", code)
        .get();

    if (userDoc.empty) {
      return res.status(401).json({success: false, error: "Invalid code"});
    }

    // Fetch data from the matching document
    const userData = userDoc.docs[0].data();
    return res.status(200).json({
      success: true,
      balance: userData.balance || 120, // From your DB field
      // Placeholder; calculate if needed (e.g., from sales)ma
      commission: userData.commission || 42,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({error: "Server error"});
  }
});

// New: /send-email endpoint for commission notifications
app.post("/send-email", async (req, res) => {
  const {toEmail, commission, balance} = req.body; // Data from your frontend

  if (!toEmail || !commission || !balance) {
    return res.status(400).json({
      error: "Missing required fields: toEmail, commission, balance",
    });
  }

  // Email content (customize as needed)
  const msg = {
    to: toEmail, // Referrer's email
    from: "acmelectrical12@gmail.com", // Your verified SendGrid sender email
    subject: "You Earned a Referral Commission!",
    text: `Congratulations! You earned QR ${commission} from a referral. ` +
      `Your new balance is QR ${balance}. - ACM HUB`,
    html: `<p>Congratulations! You earned <strong>QR ${commission}</strong> ` +
      `from a referral.</p>` +
      `<p>Your new balance is <strong>QR ${balance}</strong>.</p>` +
      `<p>Thanks! - ACM HUB</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent to:", toEmail);
    return res.status(200).json({success: true, message: "Email sent!"});
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    return res.status(500).json({error: "Failed to send email"});
  }
});

app.post('/send-push', async (req, res) => {
  const { token, commission, balance } = req.body; // Get data from frontend
  if (!token || !commission || !balance) {
    return res.status(400).send('Missing info');
  }
  await sendPushNotification(token, commission, balance); // Call the function
  res.send('Push sent!'); // Tell frontend it worked
}); 

// Export the app as an HTTP function
exports.api = functions.https.onRequest(app);
