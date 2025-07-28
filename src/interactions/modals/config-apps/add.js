const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^modal_add_app_\d+$/,
  async execute(interaction) {
    const nome = interaction.fields.getTextInputValue('nome_app_input').trim();
    const principal = interaction.fields.getTextInputValue('arquivo_app_input').trim();

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
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }
    if (produtosData[nome]) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription([
              `# App já existe ❌`,
              '-# Já existe um app/produto cadastrado com este nome.',
            ].join('\n'))
        ],
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Configuração de Apps/Produtos ${getEmoji(emojis.caixa, '📦')}`,
        '-# Envie o arquivo **.zip** do seu app/produto neste chat.',
        '-# O arquivo **deve ser .zip** e conter `squarecloud.config` ou `squarecloud.app` **e** `package.json`. O arquivo principal informado também deve existir no zip.',
        '',
        `> ${getEmoji(emojis.pontobranco, '⚪')} **Nome do App:** \`${nome}\``,
        `> ${getEmoji(emojis.pontobranco, '⚪')} **Arquivo Principal:** \`${principal}\``
      ].join('\n'))
      .addFields(
        { name: `${getEmoji(emojis.pontobranco, '⚪')} Formato do Arquivo`, value: `\`.zip\``, inline: true },
        { name: `${getEmoji(emojis.pontobranco, '⚪')} Necessário`, value: `\`squarecloud.config\` ou \`squarecloud.app\` **e** \`package.json\``, inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const msg = await interaction.reply({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [],
      fetchReply: true
    });

    const filter = m =>
      m.author.id === interaction.user.id &&
      m.attachments.first() &&
      m.attachments.first().name.endsWith('.zip');

    const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 5 * 60 * 1000 });

    collector.on('collect', async (message) => {
  await msg.edit({
    content: `${interaction.user}`,
    embeds: [
      new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# Verificando arquivos... ${getEmoji(emojis.carregando, '⏳')}`,
          '-# Aguarde, estou analisando o arquivo enviado.'
        ].join('\n'))
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    ],
    components: [],
  }); 

  const attachment = message.attachments.first();
  const JSZip = (await import('jszip')).default;
  let zipFile;
  let zip;
  let data;

  let fetchFn = global.fetch;
  if (!fetchFn) {
    fetchFn = (await import('node-fetch')).default;
  }

  let success = false;
  let attempts = 0;
  let lastError;

  while (!success && attempts < 3) {
    try {
      data = await fetchFn(attachment.url).then(res => res.arrayBuffer());
      zip = new JSZip();
      zipFile = await zip.loadAsync(data);
      success = true;
    } catch (err) {
      lastError = err;
      attempts++;
      if (attempts < 3) await new Promise(res => setTimeout(res, 1500));
    }
  }

  if (!success) {
    await msg.edit({
      content: `${interaction.user}`,
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription([
            `# Arquivo inválido ❌`,
            '-# O arquivo enviado não é um `.zip` válido ou está corrompido.'
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      components: [],
    });
    await message.delete().catch(() => {});
    return;
  }

  const hasConfig = zipFile.file('squarecloud.config') || zipFile.file('squarecloud.app');
  const hasPackage = zipFile.file('package.json');
  const hasPrincipal = zipFile.file(principal);

  if (!hasConfig || !hasPackage || !hasPrincipal) {
    let erroMsg = '-# O arquivo .zip deve conter ';
    if (!hasConfig) erroMsg += '`squarecloud.config` ou `squarecloud.app`';
    if (!hasPackage) erroMsg += (!hasConfig ? ', ' : '') + '`package.json`';
    if (!hasPrincipal) erroMsg += (!hasConfig || !hasPackage ? ', ' : '') + `o arquivo principal \`${principal}\``;
    await msg.edit({
      content: `${interaction.user}`,
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription([
            `# Arquivo inválido ❌`,
            erroMsg + '!'
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      components: [],
    });
    await message.delete().catch(() => {});
    return;
  }

  try {
    const packageJsonStr = await zipFile.file('package.json').async('string');
    const packageJson = JSON.parse(packageJsonStr);
    packageJson.main = principal;
    zipFile.file('package.json', JSON.stringify(packageJson, null, 2));
  } catch (err) {}

  const dir = path.join(__dirname, '../../../source');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const zipBuffer = await zipFile.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(dir, `${nome}.zip`), zipBuffer);

 produtosData[nome] = {
  nome,
  principal,
  arquivo: `${nome}.zip`,
  criadoPor: interaction.user.id,
  criadoEm: Date.now(),
  type: "embed",
  preco: {
    mensal: {
      onoff: true
    },
    embed: {
      cor: "Default",
      titulo: "Título não definido",
      desc: "Descrição não definida"
    },
    content: {
      content: "Descrição não definida"
    }
  },
  banner: null
};
fs.writeFileSync(produtosPath, JSON.stringify(produtosData, null, 2), 'utf8');

  await msg.edit({
    content: `${interaction.user}`,
    embeds: [
      new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# App cadastrado com sucesso! ${getEmoji(emojis.caixa, '📦')}`,
          `-# O app/produto **${nome}** foi cadastrado.`,
          '',
          `> ${getEmoji(emojis.pontobranco, '⚪')} **Arquivo:** \`${nome}.zip\``,
          `> ${getEmoji(emojis.pontobranco, '⚪')} **Principal:** \`${principal}\``
        ].join('\n'))
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    ],
    components: [],
  });

  await message.delete().catch(() => {});
});

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        await msg.edit({
          content: `${interaction.user}`,
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription([
                `# Tempo esgotado ❌`,
                '-# Nenhum arquivo .zip foi enviado.'
              ].join('\n'))
              .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          ],
          components: [],
        });
      }
    });
  },
};