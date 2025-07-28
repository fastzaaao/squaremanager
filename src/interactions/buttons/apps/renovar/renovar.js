const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const getEmoji = require('../../../../utils/getEmoji');

module.exports = {
  customId: /^renovar_app_(.+)_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^renovar_app_(.+)_(.+)_(\d+)$/);
    if (!match) return;

    const produto = match[1];
    const squareAppId = match[2];
    const userId = match[3];

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para renovar esta aplicação.',
        flags: 64
      });
    }

    const produtosPath = path.join(__dirname, '../../../../data/produtos.json');
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }
    const app = produtosData[produto];

    const applicationsPath = path.join(__dirname, '../../../../data/applications.json');
let applicationsData = {};
if (fs.existsSync(applicationsPath)) {
  try {
    applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
  } catch {
    applicationsData = {};
  }
}
const appData = applicationsData[squareAppId];

    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }
    const colorPath = path.join(__dirname, '../../../../data/color.json');
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

    const threadName = `🔄・${interaction.user.username}`;
    const existingThread = interaction.channel.threads.cache.find(
      t => t.name === threadName && !t.archived
    );
    if (existingThread) {
      return interaction.reply({
        content: `# ${getEmoji(emojis.money, '💰')} Você já possui um carrinho de renovação aberto em <#${existingThread.id}>`,
        flags: 64
      });
    }

    const thread = await interaction.channel.threads.create({
      name: threadName,
      autoArchiveDuration: 60,
      reason: `Renovação iniciada por ${interaction.user.tag}`,
      type: 12 
    });
    await thread.members.add(interaction.user.id);

    const renovarEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: 'Renovação de Aplicação',
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setDescription([
        `- Para prosseguir, clique no botão abaixo.`
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields([
          { name: 'Aplicação', value: `\`\`\`${appData?.nomeApp || 'Desconhecido'}\`\`\``, inline: true },
          { name: 'App-ID', value: `\`\`\`${squareAppId}\`\`\``, inline: true }
        ]);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prosseguir_renovacao_${produto}_${squareAppId}_${userId}`)
        .setLabel('Prosseguir para o Pagamento')
        .setEmoji(getEmoji(emojis.certo, '✅'))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`sair_renovacao_${produto}_${squareAppId}_${userId}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(ButtonStyle.Secondary)
    );

    await thread.send({
      content: `<@${userId}>`,
      embeds: [renovarEmbed],
      components: [row]
    });

    const linkButton = new ButtonBuilder()
      .setLabel('Ir para a renovação')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`);

    await interaction.reply({
      content: `# ${getEmoji(emojis.money, '💰')} Carrinho de renovação criado com sucesso!`,
      components: [
        new ActionRowBuilder().addComponents(linkButton)
      ],
      flags: 64
    });
  }
};