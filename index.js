const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// Keep server alive
const app = express();
app.get("/", (req, res) => res.send("🤖 Sofia (AI Assistant of Khan) is running."));
app.listen(3000, () => console.log("🌐 Web server running on port 3000"));

// 💡 Paste your API key below
const TOGETHER_API_KEY = 'YOUR_TOGETHER_API_KEY_HERE'; // 👈 Replace this with your actual Together API key

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

const lastReplyTime = new Map();
const memory = new Map();
const COOLDOWN_MS = 30 * 1000;

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Scan the QR code with WhatsApp Web to connect.");
});

client.on('ready', () => {
  console.log('✅ Sofia is ready to work for Khan!');
});

client.on('message', async msg => {
  if (msg.isGroupMsg) return;

  const userId = msg.from;
  const now = Date.now();

  if (lastReplyTime.has(userId)) {
    const timeSince = now - lastReplyTime.get(userId);
    if (timeSince < COOLDOWN_MS) return;
  }

  if (!memory.has(userId)) memory.set(userId, []);
  const chatMemory = memory.get(userId);
  chatMemory.push({ role: "user", content: msg.body });

  const reply = await getSofiaReply(chatMemory);
  if (reply) {
    msg.reply(reply);
    chatMemory.push({ role: "assistant", content: reply });
    lastReplyTime.set(userId, now);
  }
});

async function getSofiaReply(messages) {
  try {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [
          {
            role: "system",
            content: `You are Sofia, a polite, professional human assistant of Khan. 
You speak like a real girl — kind, respectful, but natural and confident. 
You NEVER share private info like your location, age, full name, etc. 
Your job is to:
- Greet the client warmly
- Ask what project or service they want
- Ask their budget and deadline
- Ask platform/technology if needed
- Confirm all the info
- End by saying: "Thank you! Khan will contact you shortly regarding confirmation and payment."

NEVER say you're an AI or a bot. Act like a real assistant working under Khan.`
          },
          ...messages
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ API error:', err.message);
    return "I'm sorry, I couldn’t respond right now. Please try again in a few moments.";
  }
}

client.initialize();
