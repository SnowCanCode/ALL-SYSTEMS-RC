const mongoose = require("mongoose");
const { Client, GatewayIntentBits } = require("discord.js");

const blacklist = require("./systems/blacklist");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function startBot() {
  try {
    // connect DB first
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // DO NOT query DB here

    // login discord after DB ready
    await client.login(process.env.TOKEN);

  } catch (err) {
    console.error("Startup error:", err);
  }
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

startBot();