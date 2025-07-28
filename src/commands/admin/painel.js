const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  name: 'painel',
  description: 'Exibe o painel do bot com opções.',
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Exibe o painel do bot com opções.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
  async execute(interaction) {
    const client = interaction.client;

    if (client.emojisLoading) {
      const filePath = path.join(__dirname, '../../data/color.json');
      let colorData = {};
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          colorData = JSON.parse(fileContent || '{}');
        } catch (error) {
          console.error('Erro ao ler o arquivo color.json:', error);
        }
      } else {
        console.warn('Arquivo color.json não encontrado no caminho:', filePath);
      }
      const guildId = interaction.guild.id;
      const embedColor = colorData[guildId] || '#808080';

      const avisoEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Os emojis do bot ainda estão sendo carregados. Por favor, aguarde e tente novamente em 1 minuto.');

      return interaction.reply({ embeds: [avisoEmbed], flags: 64 });
    }

    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

    const ping = client.ws.ping;
    const uptimeTimestamp = Math.floor((Date.now() - client.uptime) / 1000);

    const filePath = path.join(__dirname, '../../data/color.json');
    let colorData = {};
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo color.json:', error);
      }
    } else {
      console.warn('Arquivo color.json não encontrado no caminho:', filePath);
    }

    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Olá, **${interaction.user.username}**! 👋`,
        '-# Este é o painel de **gerenciamento do seu bot**.',
        '-# Utilize os botões abaixo para configurar **funções** e **preferências** de acordo com o **seu servidor**.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: `${getEmoji(emojis.staff, '👮‍♂️')} Versão`, value: '1.0.0', inline: true },
        { name: `${getEmoji(emojis.robo, '🤖')} Ping`, value: `${ping} ms`, inline: true },
        { name: `${getEmoji(emojis.foguete, '🚀')} Uptime`, value: `<t:${uptimeTimestamp}:R>`, inline: true }
      );

    const personalize = new ButtonBuilder()
      .setCustomId(`customize_bot_${interaction.user.id}`)
      .setLabel('Personalizar Bot')
      .setEmoji(getEmoji(emojis.custom, '🛠️'))
      .setStyle(ButtonStyle.Success);

    const manager = new ButtonBuilder()
      .setCustomId(`painel_manager_${interaction.user.id}`)
      .setLabel('Sistema de Gerenciamento')
      .setEmoji(getEmoji(emojis.escudo, '👨‍💼'))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(personalize, manager);

    await interaction.reply({ content: `${interaction.user}`, embeds: [embed], components: [row1] });
  },
};