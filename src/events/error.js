const logger = require('../utils/logger');

module.exports = {
  name: 'error',
  execute(error) {
    logger.error(`Erro capturado: ${error.message}`);
  },
};