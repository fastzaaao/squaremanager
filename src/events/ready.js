const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config(); ;
const { UploadEmojis } = require('../utils/emojisHandler');
const { verifyAndUploadEmojis } = require('../utils/emojisVerifier');
const { manterDescricaoBot } = require('../utils/botDescription');
const registrarSlashCommands = require('../utils/slashCommands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    client.emojisLoading = true;
    
    logger.success(`Bot conectado como ${client.user.tag}`);

    await UploadEmojis(client);
    await registrarSlashCommands();
    await verifyAndUploadEmojis(client);

    client.emojisLoading = false;

    const statusesFilePath = path.join(__dirname, '../data/statuses.json');
    const defaultStatus = 'made with 💗 by fast'; 

    let currentIndex = 0;

    const updateStatus = () => {
      let statuses = [defaultStatus]; 

      if (fs.existsSync(statusesFilePath)) {
        try {
          const fileContent = fs.readFileSync(statusesFilePath, 'utf8');
          const statusesData = JSON.parse(fileContent || '{}');
          const guildId = client.guilds.cache.first()?.id; 

          if (guildId && statusesData[guildId]) {
            statuses = Object.values(statusesData[guildId]).filter(status => typeof status === 'string' && status.trim() !== ''); 
          }
        } catch (error) {
          console.error('Erro ao ler o arquivo statuses.json:', error);
        }
      }

      if (statuses.length === 0) {
        statuses = [defaultStatus];
      }

      const currentStatus = statuses[currentIndex];
      client.user.setPresence({
        status: 'dnd', 
        activities: [
          {
            name: currentStatus,
            type: 4, 
          },
        ],
      });

      currentIndex = (currentIndex + 1) % statuses.length;
    };

    manterDescricaoBot();
    updateStatus();
    setInterval(updateStatus, 10000);
  },
};