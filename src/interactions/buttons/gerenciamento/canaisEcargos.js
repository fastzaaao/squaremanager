const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: 'manager_logs',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

    const permissoesPath = path.join(__dirname, '../../../data/permissoes.json');
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

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler color.json:', error);
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const selectChannelType = new StringSelectMenuBuilder()
      .setCustomId(`select_channel_type_${interaction.user.id}`)
      .setPlaceholder('#️⃣ Selecione o tipo de canal para gerenciar')
      .addOptions([
        {
          label: 'Gerenciar Logs',
          value: 'logs',
          description: 'Configurar canais de logs',
          emoji: getEmoji(emojis.escudo, '🛡️'),
        },
        {
          label: 'Gerenciar Vendas',
          value: 'vendas',
          description: 'Configurar canais de vendas',
          emoji: getEmoji(emojis.cart, '🛒'),
        },
        {
          label: 'Gerenciar Renovações',
          value: 'renovacoes',
          description: 'Configurar canais de renovações',
          emoji: getEmoji(emojis.money, '💸'),
        },
        {
          label: 'Gerenciar Backup',
          value: 'backup',
          description: 'Configurar canais de backup',
          emoji: getEmoji(emojis.backup, '💾'),
        },
      ]);

    const rowChannelType = new ActionRowBuilder().addComponents(selectChannelType);

    const selectRoles = new RoleSelectMenuBuilder()
      .setCustomId(`select_cliente_role_${interaction.user.id}_${interaction.message.id}`)
      .setPlaceholder('📮 Selecione o cargo de cliente aqui')
      .setMinValues(1)
      .setMaxValues(1);

    const rowRoles = new ActionRowBuilder().addComponents(selectRoles);

    const backButton = new ButtonBuilder()
      .setCustomId(`painel_manager_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const rowBack = new ActionRowBuilder().addComponents(backButton);

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Gerenciamento de Canais & Cargos ${getEmoji(emojis.staff, '📋')}`,
        '-# Configure os canais e cargos que serão utilizados pelos sistemas do bot.',
        '-# Selecione abaixo o tipo de canal para gerenciar e o cargo de cliente.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.update({
      embeds: [embed],
      components: [rowChannelType, rowRoles, rowBack],
    });
  },
}