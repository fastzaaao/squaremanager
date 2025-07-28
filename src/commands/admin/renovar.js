const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('renovar')
    .setDescription('Renova manualmente a data de expiração de uma aplicação.')
    .addStringOption(option =>
      option.setName('app_id')
        .setDescription('ID da aplicação')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('dias')
        .setDescription('Dias para renovar (padrão: 30)')
        .setMinValue(1)
        .setMaxValue(365))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const appId = interaction.options.getString('app_id');
    const dias = interaction.options.getInteger('dias') || 30;

    const applicationsPath = path.join(__dirname, '../../data/applications.json');
    const autoPath = path.join(__dirname, '../../data/auto.json');
    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    const colorPath = path.join(__dirname, '../../data/color.json');

    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {}
    }

    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild?.id;
    const embedColor = colorData[guildId] || '#808080';

    let applicationsData = {};
    if (fs.existsSync(applicationsPath)) {
      try {
        applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
      } catch {
        return interaction.reply({ content: 'Erro ao ler o arquivo de aplicações.', flags: 64 });
      }
    }

    const app = applicationsData[appId];
    if (!app) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Aplicação não encontrada! ${getEmoji(emojis.negative, '❌')} `)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    let baseDate = new Date();
    const dataExpiracaoAtual = new Date(app.dataExpiracao);
    if (dataExpiracaoAtual > baseDate) {
      baseDate = dataExpiracaoAtual;
    }
    baseDate.setHours(baseDate.getHours() - 3);
    baseDate.setDate(baseDate.getDate() + dias);
    app.dataExpiracao = baseDate.toISOString();

    if ('expirado' in app) {
      delete app.expirado;
    }

    if (fs.existsSync(autoPath)) {
      try {
        const autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
        if (app.owner && autoData[app.owner] && Array.isArray(autoData[app.owner].bots)) {
          const bot = autoData[app.owner].bots.find(b => b.squareAppId === appId);
          if (bot) {
            bot.dataExpiracao = app.dataExpiracao;
            if ('expirado' in bot) delete bot.expirado;
          }
        }
        fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
      } catch {}
    }

    fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));

    const dataObj = new Date(app.dataExpiracao);
    dataObj.setHours(dataObj.getHours() + 3);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR') +
    ', às ' +
    dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setDescription([
        `# Aplicação Renovada ${getEmoji(emojis.certo, '✅')} `,
        `- App-ID: \`${appId}\``,
        `- Nome: \`${app.nomeApp || 'N/A'}\``,
        `- Nova expiração: \`${dataFormatada}\``,
        `- Status: Renovada por \`${dias}\` dias`
    ].join('\n'));

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};