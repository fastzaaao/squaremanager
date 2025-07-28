const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { SquareCloudAPI } = require('@squarecloud/api');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^modal_token_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^modal_token_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild?.id;
    const embedColor = colorData[guildId] || '#808080';

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para alterar esta aplicação. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const novoToken = interaction.fields.getTextInputValue('novo_token').trim();

    let valido = false;
    try {
      const res = await axios.get("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${novoToken}` }
      });
      if (res.data && res.data.id) valido = true;
    } catch {}

    if (!valido) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# O token informado é inválido ou não é de um bot. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const autoPath = path.join(__dirname, '../../../data/auto.json');
    let autoData = {};
    if (fs.existsSync(autoPath)) {
      try {
        autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      } catch {
        autoData = {};
      }
    }

    const userBots = autoData[ownerId]?.bots || [];
    const bot = userBots.find(b => b.squareAppId === squareAppId);

    if (!bot) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Aplicação não encontrada. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    bot.tokenBot = novoToken;

    try {
      fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
    } catch (e) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Erro ao salvar as informações. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const applicationsPath = path.join(__dirname, '../../../data/applications.json');
    let applicationsData = {};
    if (fs.existsSync(applicationsPath)) {
      try {
        applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
      } catch {
        applicationsData = {};
      }
    }
    if (applicationsData[squareAppId]) {
      applicationsData[squareAppId].tokenBot = novoToken;
      try {
        fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
      } catch (e) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription(`# Erro ao salvar no applications.json. ${getEmoji(emojis.negative, '❌')}`)
          ],
          flags: 64
        });
      }
    }

    const apisPath = path.join(__dirname, '../../../data/apis.json');
    let squareApiKey = null;
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }

    let alterado = false;
    let fileAlterado = null;
    if (squareApiKey && bot.squareAppId) {
      try {
        const api = new SquareCloudAPI(squareApiKey);
        const app = await api.applications.get(bot.squareAppId);
        const files = await app.files.list();

        let fileToEdit = files.find(f => f.name === '.env' || f.name === 'config.json');
        if (fileToEdit) {
          let buffer = await app.files.read(fileToEdit.name);
          let content = buffer.toString();

          if (fileToEdit.name === '.env') {
            if (/TOKEN\s*=.*/.test(content)) {
              content = content.replace(/TOKEN\s*=.*/g, `TOKEN=${novoToken}`);
            } else {
              content += `\nTOKEN=${novoToken}`;
            }
          } else if (fileToEdit.name === 'config.json') {
            try {
              let json = JSON.parse(content);
              json.token = novoToken;
              content = JSON.stringify(json, null, 2);
            } catch {}
          }

          const success = await app.commit(Buffer.from(content), fileToEdit.name);
          if (success) {
            alterado = true;
            fileAlterado = fileToEdit.name;
          }
        }
      } catch {}
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription([
            `# Token alterado com sucesso ${getEmoji(emojis.key, '🔑')}`,
            alterado && fileAlterado
              ? `-# O token foi atualizado no arquivo \`${fileAlterado}\` da aplicação.`
              : `-# O token foi salvo localmente, mas não foi possível atualizar na SquareCloud.`
          ].join('\n\n'))
      ],
      flags: 64
    });
  }
};