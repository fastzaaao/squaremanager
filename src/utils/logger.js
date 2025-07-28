const chalk = require('chalk');

const getTime = () => {
  const now = new Date();
  return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

module.exports = {
  info: (message) => console.log(chalk.blue(`[${getTime()}] ${message}`)),
  success: (message) => console.log(chalk.green(`[${getTime()}] ${message}`)),
  error: (message) => console.error(chalk.red(`[${getTime()}] ${message}`)),
};