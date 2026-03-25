module.exports = {
  // Channels
  VERIFY_CHANNEL_ID: "1410399567945666582",
  LOG_CHANNEL_ID: "1486139572810158091",

  // Roles allowed to verify
  HR_ROLE_IDS: [
    "1483324856266264626",
    "1419827211598299167"
  ],

  // Roles given when verified
  VERIFIED_ROLE_IDS: [
    "1483318975579426950",
    "1419827266711588904",
    "1483318857463500932"
  ],

  // Role removed when verified
  UNVERIFIED_ROLE_ID: "1483328729903271936",

  // Emojis
  VERIFY_EMOJI: "✅",
  UNVERIFY_EMOJI: "❌",

  // Anti-alt
  MIN_ACCOUNT_AGE_DAYS: 7,

  // Promotion system (for later)
  COMMAND_ROLE_IDS: [
    "1483324856266264626"
  ],

  // Rank hierarchy (ORDER MATTERS: lowest → highest)
  RANK_ROLES: [
    "ROLE_ID_LOWEST",
    "ROLE_ID_MID",
    "ROLE_ID_HIGH"
  ]
};