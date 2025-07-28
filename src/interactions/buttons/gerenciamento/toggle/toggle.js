const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../../utils/getEmoji');

module.exports = {
  customId: /^toggle_sistema_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    if (interaction.user.id !== userId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const configPath = path.join(__dirname, '../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }

    configData.sistema = !configData.sistema;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o estado do sistema.`)
        ],
        flags: 64,
      });
    }

    const status = configData.sistema ? 'ativado' : 'desativado';
    const emojiStatus = configData.sistema ? getEmoji(emojis.on, '🟢') : getEmoji(emojis.off, '🔴');

    const colorPath = path.join(__dirname, '../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const painelEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Sistema de Gerenciamento ${getEmoji(emojis.staff, '🛠️')}`,
        '-# Aqui você pode acessar e configurar **sistemas avançados** do seu bot.',
        '-# Utilize os botões abaixo para gerenciar **permissões**, **logs**, **canais** e outras funções administrativas.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const sistemaButton = new ButtonBuilder()
      .setCustomId(`toggle_sistema_${interaction.user.id}`)
      .setEmoji(emojiStatus)
      .setStyle(configData.sistema ? ButtonStyle.Success : ButtonStyle.Danger);

    const permissionsButton = new ButtonBuilder()
      .setCustomId(`manager_permissions_${interaction.user.id}`)
      .setLabel('Permissões')
      .setEmoji(getEmoji(emojis.chave, '👮‍♂️'))
      .setStyle(ButtonStyle.Secondary);

    const logsButton = new ButtonBuilder()
      .setCustomId(`manager_logs_${interaction.user.id}`)
      .setLabel('Canais & Cargos')
      .setEmoji(getEmoji(emojis.staff, '🛠️'))
      .setStyle(ButtonStyle.Secondary);

    const definicoesButton = new ButtonBuilder()
      .setCustomId(`manager_definicoes_${interaction.user.id}`)
      .setLabel('Definições')
      .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`back_panel_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(
      sistemaButton,
      permissionsButton,
      logsButton,
      definicoesButton,
      backButton
    );

    await interaction.update({
      embeds: [painelEmbed],
      components: [row1],
    });
  },
}