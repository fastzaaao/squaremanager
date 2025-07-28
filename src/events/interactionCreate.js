const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
};

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        await interaction.reply({ content: 'Comando não encontrado.', flags: 64 });
        return;
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
        await interaction.reply({
          content: 'Ocorreu um erro ao executar este comando.',
          flags: 64,
        });
      }
      return;
    }

    if (interaction.isButton()) {
      if (
  interaction.customId.startsWith('copyPix') ||
  interaction.customId.startsWith('tutorial_')
) return;
      const buttonHandlersPath = path.join(__dirname, '../interactions/buttons');
      const buttonFiles = getAllFiles(buttonHandlersPath);

      for (const file of buttonFiles) {
        const buttonHandler = require(file);

        if (
          typeof buttonHandler.customId === 'string' &&
          interaction.customId.startsWith(buttonHandler.customId)
        ) {
          try {
            await buttonHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do botão ${buttonHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        } else if (
          buttonHandler.customId instanceof RegExp &&
          buttonHandler.customId.test(interaction.customId)
        ) {
          try {
            await buttonHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do botão ${buttonHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        }
      }

      await interaction.reply({
        content: 'Este botão não está configurado.',
        flags: 64,
      });
    } else if (interaction.isModalSubmit()) {
      const modalHandlersPath = path.join(__dirname, '../interactions/modals');
      const modalFiles = getAllFiles(modalHandlersPath);

      for (const file of modalFiles) {
        const modalHandler = require(file);

        if (
          typeof modalHandler.customId === 'string' &&
          interaction.customId.startsWith(modalHandler.customId)
        ) {
          try {
            await modalHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do modal ${modalHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        } else if (
          modalHandler.customId instanceof RegExp &&
          modalHandler.customId.test(interaction.customId)
        ) {
          try {
            await modalHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do modal ${modalHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        }
      }

      await interaction.reply({
        content: 'Este modal não está configurado.',
        flags: 64,
      });
    } else if (interaction.isStringSelectMenu()) {
      const selectMenuHandlersPath = path.join(__dirname, '../interactions/selectMenus');
      const selectMenuFiles = getAllFiles(selectMenuHandlersPath);

      for (const file of selectMenuFiles) {
        const selectMenuHandler = require(file);

        if (
          typeof selectMenuHandler.customId === 'string' &&
          interaction.customId.startsWith(selectMenuHandler.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        } else if (
          selectMenuHandler.customId instanceof RegExp &&
          selectMenuHandler.customId.test(interaction.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        }
      }

      await interaction.reply({
        content: 'Este select menu não está configurado.',
        flags: 64,
      });
    }
    else if (interaction.isChannelSelectMenu()) {
      const selectMenuHandlersPath = path.join(__dirname, '../interactions/selectMenus');
      const selectMenuFiles = getAllFiles(selectMenuHandlersPath);

      for (const file of selectMenuFiles) {
        const selectMenuHandler = require(file);

        if (
          typeof selectMenuHandler.customId === 'string' &&
          interaction.customId.startsWith(selectMenuHandler.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do channel select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        } else if (
          selectMenuHandler.customId instanceof RegExp &&
          selectMenuHandler.customId.test(interaction.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do channel select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        }
      }

      await interaction.reply({
        content: 'Este channel select menu não está configurado.',
        flags: 64,
      });
    } else if (interaction.isRoleSelectMenu()) {
      const selectMenuHandlersPath = path.join(__dirname, '../interactions/selectMenus');
      const selectMenuFiles = getAllFiles(selectMenuHandlersPath);

      for (const file of selectMenuFiles) {
        const selectMenuHandler = require(file);

        if (
          typeof selectMenuHandler.customId === 'string' &&
          interaction.customId.startsWith(selectMenuHandler.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do role select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        } else if (
          selectMenuHandler.customId instanceof RegExp &&
          selectMenuHandler.customId.test(interaction.customId)
        ) {
          try {
            await selectMenuHandler.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar o handler do role select menu ${selectMenuHandler.customId}:`, error);
            await interaction.reply({
              content: 'Ocorreu um erro ao processar sua interação.',
              flags: 64,
            });
          }
          return;
        }
      }

      await interaction.reply({
        content: 'Este role select menu não está configurado.',
        flags: 64,
      });
    } else if (interaction.isAutocomplete()) {
  const command = client.commands.get(interaction.commandName);
  if (command && command.autocomplete) {
    await command.autocomplete(interaction);
  }
}
  }, 
};