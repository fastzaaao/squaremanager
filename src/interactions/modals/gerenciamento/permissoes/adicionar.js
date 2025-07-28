const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../../../config/config');
const getEmoji = require('../../../../utils/getEmoji');

module.exports = {
  customId: 'add_permission_user_modal',
  async execute(interaction) {
    const client = interaction.client;

    const colorPath = path.join(__dirname, '../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler color.json:', error);
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler emojisCache.json:', error);
      }
    }

    const permissoesPath = path.join(__dirname, '../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler permissoes.json:', error);
      }
    }
    if (!permissoesData[guildId]) permissoesData[guildId] = { users: [] };

    if (permissoesData[guildId].users.length >= 25) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`O limite de 25 usuários com permissão já foi atingido. Remova algum usuário antes de adicionar outro.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64,
      });
    }

    const userIdsRaw = interaction.fields.getTextInputValue('user_ids');
    const userIds = userIdsRaw
      .split(',')
      .map(id => id.trim())
      .filter(id => /^\d+$/.test(id));

    if (userIds.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Nenhum ID válido informado.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64,
      });
    }

    const validIds = [];
    const invalidIds = [];
    for (const id of userIds) {
      try {
        const user = await client.users.fetch(id).catch(() => null);
        if (user) validIds.push(id);
        else invalidIds.push(id);
      } catch {
        invalidIds.push(id);
      }
    }

    let added = [];
    let already = [];
    for (const id of validIds) {
      if (permissoesData[guildId].users.length >= 25) break;
      if (!permissoesData[guildId].users.includes(id)) {
        permissoesData[guildId].users.push(id);
        added.push(id);
      } else {
        already.push(id);
      }
    }

    try {
      fs.writeFileSync(permissoesPath, JSON.stringify(permissoesData, null, 2), 'utf8');
    } catch (error) {
      console.error('Erro ao salvar permissoes.json:', error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar permissões.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64,
      });
    }

    let desc = '';
    if (added.length > 0) {
      desc += `-# **Usuário(s) adicionado(s):**\n${added.map(id => `<@${id}>`).join('\n')}\n\n`;
    }
    if (already.length > 0) {
      desc += `-# **Usuário(s) já tinham permissão:**\n${already.map(id => `<@${id}>`).join('\n')}\n\n`;
    }
    if (invalidIds.length > 0) {
      desc += `-# **IDs inválidos ou não encontrados:**\n${invalidIds.map(id => `\`${id}\``).join('\n')}`;
    }
    if (!desc) desc = '-# Nenhum usuário novo foi adicionado.';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Gerenciamento de Permissões ${getEmoji(emojis.chave, '🔑')}`,
        '',
        desc
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed], flags: 64 });
    try {
  const mainMessage = await interaction.channel.messages.fetch(interaction.message.id);
  const usersList = permissoesData[guildId].users.length > 0
    ? permissoesData[guildId].users.map(id => `<@${id}>`).join('\n')
    : '*Nenhum usuário com permissão configurado.*';

  const mainEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setDescription([
      '# Gerenciamento de Permissões 🔒',
      '-# Aqui você pode definir quem pode acessar comandos e sistemas do bot.',
      '-# Use os botões abaixo para adicionar ou remover permissões de cargos ou usuários.',
      '',
      `**Usuários com permissão:**\n${usersList}`,
    ].join('\n'))
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

  const addUserButton = new ButtonBuilder()
    .setCustomId(`add_permission_user_${interaction.user.id}`)
    .setLabel('Adicionar Usuário')
    .setEmoji(getEmoji(emojis.plus, '➕'))
    .setStyle(ButtonStyle.Success);

  const removeUserButton = new ButtonBuilder()
    .setCustomId(`remove_permission_user_${interaction.user.id}`)
    .setLabel('Remover Usuário')
    .setEmoji(getEmoji(emojis.menos, '➖'))
    .setStyle(ButtonStyle.Danger);

  const backButton = new ButtonBuilder()
    .setCustomId(`painel_manager_${interaction.user.id}`)
    .setEmoji(getEmoji(emojis.seta, '⬅️'))
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(addUserButton, removeUserButton, backButton);

  await mainMessage.edit({
    embeds: [mainEmbed],
    components: [row1],
  });
} catch (error) {
  console.error('Erro ao editar a mensagem principal de permissões:', error);
}
  },
}