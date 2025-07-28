const fs = require('fs');
const path = require('path');

async function excluirBackupsAntigos() {
  const backupsDir = path.join(__dirname, '../source/backups');
  if (!fs.existsSync(backupsDir)) return;

  const arquivos = fs.readdirSync(backupsDir);
  const agora = Date.now();
  const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;

  for (const arquivo of arquivos) {
    if (!arquivo.endsWith('.zip')) continue;

    const match = arquivo.match(/_(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\.zip$/);
    if (!match) continue;

    const dataStr = match[1]; 
    const [ano, mes, dia, hora, min, seg] = dataStr.split('-').map(Number);
    const dataArquivo = new Date(Date.UTC(ano, mes - 1, dia, hora, min, seg));
    const diff = agora - dataArquivo.getTime();

    if (diff > cincoDiasMs) {
      const filePath = path.join(backupsDir, arquivo);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Erro ao excluir backup ${arquivo}:`, err?.message || err);
      }
    }
  }
}

module.exports = { excluirBackupsAntigos };