const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^outras_app_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^outras_app_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para gerenciar esta aplicação. ${getEmoji('❌')} `)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
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
    const userApps = autoData[ownerId]?.bots || [];
    const bot = userApps.find(b => b.squareAppId === squareAppId);

    if (!bot) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Aplicação não encontrada.${getEmoji('❌')} `)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

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
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Alterar Dados da Aplicação ${getEmoji(emojis.engrenagem, '⚙️')}`,
        `-# Selecione abaixo o que você deseja alterar nesta aplicação.`
      ].join('\n\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const select = new StringSelectMenuBuilder()
      .setCustomId(`alterar_app_${bot.squareAppId}_${interaction.user.id}`)
      .setPlaceholder('Selecione o que deseja alterar')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Nome da aplicação')
          .setValue('alterar_nome')
          .setDescription('Altere o nome exibido para esta aplicação.')
          .setEmoji(getEmoji(emojis.caixa, '📦')),
        new StringSelectMenuOptionBuilder()
          .setLabel('Token da aplicação')
          .setDescription('Atualize o token do seu bot.')
          .setValue('alterar_token')
          .setEmoji(getEmoji(emojis.key, '🔑')),
        new StringSelectMenuOptionBuilder()
          .setLabel('Transferir posse')
          .setDescription('Transfira a posse desta aplicação para outro usuário.')
          .setValue('transferir_posse')
          .setEmoji(getEmoji(emojis.coroa, '👑'))
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
      flags: 64
    });
  }
};