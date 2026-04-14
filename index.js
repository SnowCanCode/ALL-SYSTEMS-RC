const mongoose = require("mongoose");
const { Client, GatewayIntentBits } = require("discord.js");

// your other imports (keep yours below)
const blacklist = require("./systems/blacklist");

// create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// -------------------- STARTUP --------------------

async function startBot() {
  try {
    // 1. CONNECT TO MONGO FIRST (CRITICAL FIX)
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // 2. SAFE DB TEST (optional but useful)
    await blacklist.find({});
    console.log("Blacklist collection loaded");

    // 3. LOGIN DISCORD ONLY AFTER DB IS READY
    await client.login(process.env.TOKEN);

  } catch (err) {
    console.error("Startup error:", err);
  }
}

// -------------------- EVENTS --------------------

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// -------------------- START --------------------

startBot();