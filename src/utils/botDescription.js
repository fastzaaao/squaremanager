require('dotenv').config();
const axios = require('axios');

function setDescricaoBot() {
  axios.patch('https://discord.com/api/v10/applications/@me', {
    description: `square manager\nmade with 💗 by fast`
  }, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }).catch(() => {});
}

function manterDescricaoBot() {
  setDescricaoBot();
  setInterval(setDescricaoBot, 3600000);
}

module.exports = { manterDescricaoBot };