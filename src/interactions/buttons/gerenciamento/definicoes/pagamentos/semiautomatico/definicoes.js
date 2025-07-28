const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../../../../utils/getEmoji');
const config = require('../../../../../../config/config');

module.exports = {
  customId: /^definicoes_semiautomatico_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    const permissoesPath = path.join(__dirname, '../../../../../../data/permissoes.json');
        let permissoesData = {};
        if (fs.existsSync(permissoesPath)) {
          try {
            const fileContent = fs.readFileSync(permissoesPath, 'utf8');
            permissoesData = JSON.parse(fileContent || '{}');
          } catch (error) {
            console.error('Erro ao ler permissoes.json:', error);
          }
        }
        const guildId = interaction.guild.id;
        const usersPermitidos = permissoesData[guildId]?.users || [];
        const isOwner = interaction.user.id === config.ownerId;
        const isPermitido = usersPermitidos.includes(interaction.user.id);
    
        if (!isOwner && !isPermitido) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('Você não tem permissão para interagir com este botão.');
    
          return interaction.reply({
            embeds: [embed],
            flags: 64,
          });
        }

    const colorPath = path.join(__dirname, '../../../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const configPath = path.join(__dirname, '../../../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }
    const chavePix = configData.semi?.chave || 'Não definida';
    const aprovador = configData.semi?.aprovador
      ? `<@&${configData.semi.aprovador}>`
      : '\`Não definido\`';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Definições Semi-Automático ${getEmoji(emojis.engrenagem, '⚙️')}`,
        '-# Configure abaixo a chave PIX e o cargo de aprovador para o sistema semi-automático.',
        '',
      ].join('\n'))
      .addFields(
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Chave PIX`,
          value: `\`${chavePix}\``,
          inline: true,
        },
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Cargo de Aprovador`,
          value: aprovador,
          inline: true,
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const pixButton = new ButtonBuilder()
      .setCustomId(`definir_pix_${interaction.user.id}`)
      .setLabel('Definir Chave Pix')
      .setEmoji(getEmoji(emojis.pix, '💠'))
      .setStyle(ButtonStyle.Secondary);

    const cargoButton = new ButtonBuilder()
      .setCustomId(`definir_cargo_aprovador_${interaction.user.id}`)
      .setLabel('Definir Cargo de Aprovador')
      .setEmoji(getEmoji(emojis.cargo, '🛡️'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_semiautomatico_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(pixButton, cargoButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
}