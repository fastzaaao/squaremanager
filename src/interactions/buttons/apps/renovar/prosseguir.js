const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const getEmoji = require('../../../../utils/getEmoji');
const { SquareCloudAPI } = require('@squarecloud/api');

module.exports = {
  customId: /^prosseguir_renovacao_(.+)_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^prosseguir_renovacao_(.+)_(.+)_(\d+)$/);
    if (!match) return;

    const produto = match[1];
    const squareAppId = match[2];
    const userId = match[3];

    const produtosPath = path.join(__dirname, '../../../../data/produtos.json');
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
    
    const configPath = path.join(__dirname, '../../../../data/config.json');
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

    const colorPath = path.join(__dirname, '../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        colorData = JSON.parse(fs.readFileSync(colorPath, 'utf8'));
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#00B1EA';

    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
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
        description: `Renovação da aplicação ${appData?.nomeApp}`,
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
      .setAuthor({ name: `Renovação de Aplicação`, iconURL: interaction.user.displayAvatarURL() })
      .addFields(
        { name: 'Aplicação', value: `\`\`\`${appData?.nomeApp || 'Desconhecido'}\`\`\``, inline: true },
        { name: 'Valor', value: `\`\`\`R$ ${valor.toFixed(2)}\`\`\``, inline: true },
        { name: 'Tempo para pagar', value: `\`\`\`${tempoPay} minutos\`\`\``, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setImage('attachment://qrcode.png')
      .setFooter({ text: 'Após o pagamento, aguarde a confirmação automática ou envie o comprovante se necessário.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copyPix_renovacao_${produto}_${userId}`)
        .setLabel('Copia & Cola')
        .setEmoji(getEmoji(emojis.pix, '💠'))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`sair_renovacao_${produto}_${squareAppId}_${userId}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.followUp({
      content: `<@${userId}>`,
      embeds: [embed],
      files: [attachment],
      components: [row]
    });

    const channel = interaction.channel;
    if (channel) {
      const collector = channel.createMessageComponentCollector({
        filter: i =>
          i.customId === `copyPix_renovacao_${produto}_${userId}` &&
          i.user.id === userId,
        time: 10 * 60 * 1000 
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

          const estavaExpirada = appData.expirado === true;
          if ('expirado' in appData) {
            delete appData.expirado;
          }

          let baseDate = new Date();
          const dataExpiracaoAtual = new Date(appData.dataExpiracao);
          if (dataExpiracaoAtual > baseDate) {
            baseDate = dataExpiracaoAtual;
          }
          baseDate.setHours(baseDate.getHours() - 3);
          baseDate.setDate(baseDate.getDate() + 30); 
          appData.dataExpiracao = baseDate.toISOString();

          const autoPath = path.join(__dirname, '../../../../data/auto.json');
          let autoData = {};
          if (fs.existsSync(autoPath)) {
            try {
              autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
            } catch {
              autoData = {};
            }
          }
          if (autoData[userId] && Array.isArray(autoData[userId].bots)) {
            for (const bot of autoData[userId].bots) {
              if (bot.squareAppId === squareAppId) {
                bot.dataExpiracao = appData.dataExpiracao;
              }
            }
            fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
          }

          applicationsData[squareAppId] = appData;
          fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));

          const dataObj = new Date(appData.dataExpiracao);
          dataObj.setHours(dataObj.getHours() + 3);
          const dataFormatada = dataObj.toLocaleDateString('pt-BR') +
            ', às ' +
            dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          let squareApiKey = null;
          const apisPath = path.join(__dirname, '../../../../data/apis.json');
          if (fs.existsSync(apisPath)) {
            try {
              const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
              squareApiKey = apis.square;
            } catch {}
          }
          if (squareApiKey && squareAppId) {
            try {
              const api1 = new SquareCloudAPI(squareApiKey);
              const application = await api1.applications.get(squareAppId);
              const status = await application.getStatus();
              if (status.status !== 'running' && estavaExpirada) {
                await application.start();
              }
            } catch (err) {}
          }

          const confirmEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Aplicação Renovada ${getEmoji(emojis.certo, '✅')}`,
              `- App-ID: \`${squareAppId}\``,
              `- Nome: \`${appData.nomeApp || 'N/A'}\``,
              `- Nova expiração: \`${dataFormatada}\``,
              `- Status: Renovada por \`30\` dias`
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

          await msg.edit({
            embeds: [confirmEmbed],
            components: [],
            attachments: []
          });

          try {
            const renovacoesChannelId = configData.renovacoes;
            const renovacoesChannel = await interaction.guild.channels.fetch(renovacoesChannelId).catch(() => null);
            if (renovacoesChannel && renovacoesChannel.isTextBased()) {
              const logEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: 'Renovação Confirmada', iconURL: interaction.user.displayAvatarURL() })
                .setDescription([
                  `- Usuário: <@${userId}>`,
                  `- Produto: \`${produto}\``,
                  `- Aplicação: \`${appData.nomeApp || 'N/A'}\``,
                  `- App-ID: \`${squareAppId}\``,
                  `- Nova expiração: \`${dataFormatada}\``,
                  `- Valor: R$ ${valor.toFixed(2)}`,
                  `- Data: <t:${Math.floor(Date.now() / 1000)}:f>`
                ].join('\n'))
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

              await renovacoesChannel.send({ embeds: [logEmbed] });
            }
          } catch {}

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
                `- Caso ainda queira renovar, abra um novo carrinho.`
              ].join('\n'))
              .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          ],
          components: [],
          attachments: []
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