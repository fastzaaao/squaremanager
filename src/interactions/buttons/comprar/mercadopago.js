const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^pagamento_mercadopago_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^pagamento_mercadopago_(.+)_(\d+)$/);
    if (!match) return;

    const produto = match[1];
    const userId = match[2];
    const user = interaction.user;

    const produtosPath = path.join(__dirname, '../../../data/produtos.json');
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        produtosData = JSON.parse(fs.readFileSync(produtosPath, 'utf8'));
      } catch {
        produtosData = {};
      }
    }
    const produtoInfo = produtosData[produto];
    if (!produtoInfo) {
      return interaction.reply({ content: 'Produto não encontrado.', flags: 64 });
    }

    const configPath = path.join(__dirname, '../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        configData = {};
      }
    }
    const mpToken = configData.mercadopago?.chave;
    if (!mpToken) {
      return interaction.reply({ content: 'Chave Mercado Pago não configurada.', flags: 64 });
    }
    const tempoPay = Number(configData.semi?.tempoPay) || 10;
    const clienteRoleId = configData.cliente;
    const vendasChannelId = configData.vendas;

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        colorData = JSON.parse(fs.readFileSync(colorPath, 'utf8'));
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {}
    }

    const valor = Number(produtoInfo.preco?.mensal?.preco);
    if (!valor || isNaN(valor)) {
      return interaction.reply({ content: 'Valor do produto inválido.', flags: 64 });
    }

    await interaction.deferUpdate();
    let qrCodeBase64 = null;
    let copiaCola = null;
    let paymentId = null;
    try {
      const body = {
        transaction_amount: valor,
        description: `Compra do produto ${produtoInfo?.nome}`,
        payment_method_id: 'pix',
        payer: {
          email: 'email@exemplo.com'
        }
      };
      const idempotencyKey = `${interaction.user.id}-${Date.now()}`;
      const response = await axios.post('https://api.mercadopago.com/v1/payments', body, {
        headers: {
          Authorization: `Bearer ${mpToken}`,
          'X-Idempotency-Key': idempotencyKey
        }
      });
      qrCodeBase64 = response.data.point_of_interaction?.transaction_data?.qr_code_base64;
      copiaCola = response.data.point_of_interaction?.transaction_data?.qr_code;
      paymentId = response.data.id;
    } catch (error) {
      console.error('Erro ao criar cobrança Mercado Pago:', error?.response?.data || error);
      return interaction.followUp({
        content: 'Erro ao gerar cobrança Mercado Pago.',
        flags: 64
      });
    }

    const qrBuffer = Buffer.from(qrCodeBase64, 'base64');
    const attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' });

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({ name: `Pagamento Mercado Pago`, iconURL: interaction.user.displayAvatarURL() })
      .addFields(
        { name: 'Produto', value: `\`\`\`${produtoInfo?.nome || 'Desconhecido'}\`\`\``, inline: true },
        { name: 'Valor', value: `\`\`\`R$ ${valor.toFixed(2)}\`\`\``, inline: true },
        { name: 'Tempo para pagar', value: `\`\`\`${tempoPay} minutos\`\`\``, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setImage('attachment://qrcode.png')
      .setFooter({ text: 'Após o pagamento, envie o comprovante ou aguarde a confirmação automática.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copyPix_compra_${produto}_${userId}`)
        .setLabel('Copia & Cola')
        .setEmoji(getEmoji(emojis.pix, '💠'))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`sair_carrinho_${produto}_${userId}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.editReply({
      content: `<@${userId}>`,
      embeds: [embed],
      files: [attachment],
      components: [row]
    });

    const channel = interaction.channel;
    if (channel) {
      const collector = channel.createMessageComponentCollector({
        filter: i =>
          i.customId === `copyPix_compra_${produto}_${userId}` &&
          i.user.id === userId,
        time: tempoPay * 60 * 1000
      });

      collector.on('collect', async i => {
        await i.reply({
          content: `${copiaCola}`,
          flags: 64
        });
      });
    }

    let paymentApproved = false;
    const checkInterval = setInterval(async () => {
      try {
        const paymentRes = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpToken}` }
        });
        if (paymentRes.data.status === 'approved') {
          paymentApproved = true;
          clearInterval(checkInterval);
          

          const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`autenticar_bot_${produto}_${user.id}`)
              .setLabel('Autenticar Bot')
              .setEmoji(getEmoji(emojis.certo, '✅'))
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`tutorial_${produto}_${user.id}`)
              .setLabel('Tutorial Token')
              .setEmoji(getEmoji(emojis.menos, '➖'))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setLabel('Discord Devs')
              .setStyle(ButtonStyle.Link)
              .setEmoji(getEmoji(emojis.code, '💻'))
              .setURL('https://discord.com/developers/applications')
          );

          const confirmEmbed = new EmbedBuilder()
            .setColor(produtoInfo.preco?.embed?.cor === 'Default' ? embedColor : produtoInfo.preco.embed.cor)
            .setAuthor({
              name: 'Pagamento Confirmado',
              iconURL: user.displayAvatarURL({ dynamic: true })
            })
            .setDescription([
              `- O pagamento do produto foi confirmado com sucesso!`,
              `- Usuário: <@${user.id}>`,
              `- Data: <t:${Math.floor(Date.now() / 1000)}:f>`
            ].join('\n'))
            .addFields(
              {
                name: 'Produto',
                value: `\`\`\`${produtoInfo.nome}\`\`\``,
                inline: true
              },
              {
                name: 'Valor Mensal',
                value: `\`\`\`R$ ${produtoInfo.preco.mensal.preco}\`\`\``,
                inline: true
              }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

          await msg.edit({
            content: `# ${getEmoji(emojis.certo, '✅')} ${user}, seu pagamento foi confirmado! Escolha uma das opções abaixo:`,
            components: [confirmRow],
            embeds: [confirmEmbed],
            attachments: []
          });

          await interaction.channel.send({ embeds: [confirmEmbed] });

          try {
            const vendasChannel = await interaction.guild.channels.fetch(vendasChannelId).catch(() => null);
            if (vendasChannel && vendasChannel.isTextBased()) {
              await vendasChannel.send({ embeds: [confirmEmbed] });
            }
          } catch {}

          if (clienteRoleId) {
            try {
              const member = await interaction.guild.members.fetch(user.id);
              if (member && !member.roles.cache.has(clienteRoleId)) {
                await member.roles.add(clienteRoleId);
              }
            } catch {}
          }

          const tutorialCollector = interaction.channel.createMessageComponentCollector({
            filter: i =>
              i.customId === `tutorial_${produto}_${user.id}` &&
              i.user.id === user.id,
            time: 10 * 60 * 1000
          });

          tutorialCollector.on('collect', async i => {
            await i.reply({
              flags: 64,
              embeds: [
                new EmbedBuilder()
                  .setColor(embedColor)
                  .setDescription([
                    `# ${getEmoji(emojis.code, '💻')} Tutorial: Como criar uma aplicação e obter o Token`,
                    '1. Acesse o site [Discord Developer Portal](https://discord.com/developers/applications)',
                    '2. Clique em "**New Application**" e escolha um nome.',
                    '3. No menu lateral, clique em "**Bot**" e depois em "**Add Bot**".',
                    '4. Clique em "**Reset Token**" e depois em "**Copy**" para copiar seu token.',
                  ].join('\n'))
              ]
            });
          });

          setTimeout(() => {
            try {
              if (channel && channel.isThread()) {
                channel.delete().catch(err => console.error('Erro ao apagar thread:', err));
              }
            } catch (err) {
              console.error('Erro ao tentar apagar thread:', err);
            }
          }, 5 * 60 * 1000);
        }
      } catch (err) {}
    }, 5000);

    setTimeout(async () => {
      if (!paymentApproved) {
        clearInterval(checkInterval);
        await msg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription([
                `# Carrinho fechado ${getEmoji(emojis.negative, '❌')}`,
                `- O tempo para realizar o pagamento expirou (\`${tempoPay} minutos\`).`,
                `- Caso ainda queira comprar, abra um novo carrinho.`
              ].join('\n'))
              .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          ],
          components: []
        });

        setTimeout(() => {
          try {
            if (channel && channel.isThread()) {
              channel.delete().catch(err => console.error('Erro ao apagar thread:', err));
            }
          } catch (err) {
            console.error('Erro ao tentar apagar thread:', err);
          }
        }, 5 * 60 * 1000);
      }
    }, tempoPay * 60 * 1000);
  }
};