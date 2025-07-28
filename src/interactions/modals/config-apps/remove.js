const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: 'modal_remove_app',
  async execute(interaction) {
    const nome = interaction.fields.getTextInputValue('nome_app_remover_input').trim();

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

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

    const produtosPath = path.join(__dirname, '../../../data/produtos.json');
    const sourceDir = path.join(__dirname, '../../../source');
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }

    if (!produtosData[nome]) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# App não encontrado ${getEmoji(emojis.caixa, '📦')}`,
              `-# Não existe um app/produto cadastrado com o nome **${nome}**.`
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const zipName = produtosData[nome].arquivo;
    const zipPath = path.join(sourceDir, zipName);
    if (zipName && fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
      } catch {}
    }

    delete produtosData[nome];
    fs.writeFileSync(produtosPath, JSON.stringify(produtosData, null, 2), 'utf8');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# App removido com sucesso! ${getEmoji(emojis.caixa, '📦')}`,
            `-# O app/produto **${nome}** foi removido do sistema.`
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      flags: 64
    });
  }
};