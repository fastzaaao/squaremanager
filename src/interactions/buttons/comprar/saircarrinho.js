module.exports = {
  customId: /^sair_carrinho_(.+)_\d+$/,
  async execute(interaction) {
    const thread = interaction.channel;
    const user = interaction.user;

    await thread.members.remove(user.id);

    setTimeout(async () => {
      await thread.delete('Carrinho cancelado pelo usuário.');
    }, 5 * 60 * 1000);

     await interaction.reply({
      content: 'Seu carrinho será excluído em 5 minutos.',
      flags: 64
    });
  }
};