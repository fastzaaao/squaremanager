const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

function validarChavePix(tipo, chave) {
  switch (tipo) {
    case 'Email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
    case 'Telefone':
      return /^55\d{11}$/.test(chave);
    case 'CPF':
      return /^\d{11}$/.test(chave);
    default:
      return false;
  }
}

module.exports = {
  customId: /^modal_definir_pix_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        emojis = {};
      }
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
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const chave = interaction.fields.getTextInputValue('chave_pix_input');
    let tipo = interaction.fields.getTextInputValue('tipo_pix_input').trim();

    tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();

    if (!['Email', 'Telefone', 'Cpf', 'CPF'].includes(tipo)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`O tipo da chave PIX deve ser **Email**, **Telefone** ou **CPF**.`)
        ],
        flags: 64,
      });
    }

    if (tipo === 'Cpf') tipo = 'CPF';

    if (!validarChavePix(tipo, chave)) {
      let msgErro = 'A chave PIX fornecida não corresponde ao tipo selecionado.';
      if (tipo === 'Telefone') msgErro += '\nO número deve começar com 55 e conter 13 dígitos (ex: 5511999999999).';
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${msgErro}`)
        ],
        flags: 64,
      });
    }

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
    if (!configData.semi) configData.semi = {};
    configData.semi.chave = chave;
    configData.semi.tipo = tipo;

    const aprovador = configData.semi.aprovador
      ? `<@&${configData.semi.aprovador}>`
      : '\`Não definido\`';

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar a chave PIX.`)
        ],
        flags: 64,
      });
    }

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Definições Semi-Automático ${emojis.engrenagem || '⚙️'}`,
            '-# Configure abaixo a chave PIX e o cargo de aprovador para o sistema semi-automático.',
            '',
          ].join('\n'))
          .addFields(
            {
              name: 'Chave PIX',
              value: `\`${chave}\``,
              inline: true,
            },
            {
              name: 'Cargo de Aprovador',
              value: aprovador,
              inline: true,
            }
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      components: interaction.message.components,
    });
  },
}