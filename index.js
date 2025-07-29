const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// Optional: to keep Replit alive using UptimeRobot
const app = express();
app.get("/", (req, res) => res.send("🤖 Sofia WhatsApp bot is running."));
app.listen(3000, () => console.log("🌐 Web server running on port 3000"));

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// Anti-spam tracking: user => last response time
const lastReplyTime = new Map();
const COOLDOWN_MS = 30 * 1000; // 30 seconds

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Scan the QR code with WhatsApp Web to connect.");
});

client.on('ready', () => {
  console.log('✅ Sofia WhatsApp bot is ready!');
});

client.on('message', async msg => {
  if (msg.isGroupMsg) return; // Ignore group messages
  const userId = msg.from;
  const now = Date.now();

  // Anti-spam check
  if (lastReplyTime.has(userId)) {
    const timeSince = now - lastReplyTime.get(userId);
    if (timeSince < COOLDOWN_MS) {
      console.log(`⏳ Cooldown: skipping reply to ${userId}`);
      return;
    }
  }

  console.log(`💬 Message from ${userId}: "${msg.body}"`);

  // Simulate human typing delay
  setTimeout(async () => {
    const reply = await getSofiaReply(msg.body);
    if (reply) {
      msg.reply(reply);
      lastReplyTime.set(userId, Date.now()); // Start cooldown
    }
  }, 10 * 1000); // 10-second delay
});

// Get reply from Together AI
async function getSofiaReply(userText) {
  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [
          { role: 'system', content: 'You are Sofia, a friendly and helpful assistant.' },
          { role: 'user', content: userText }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer 56bf07bdcdd097b591c117f1bf6b587fe457eca4a413e6b316f8bc1bd5ed5def',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ API error:', err.message);
    return "Sorry, I couldn't respond right now. Try again later.";
  }
}

client.initialize();
