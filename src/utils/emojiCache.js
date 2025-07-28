const fs = require('fs');
const path = require('path');
const cacheFilePath = path.join(__dirname, 'emojisCache.json');

let emojiCache = {};

function carregarCache() {
    try {
        const data = fs.readFileSync(cacheFilePath, 'utf8');
        emojiCache = JSON.parse(data);
    } catch (error) {
        emojiCache = {};
    }
}

function salvarCache() {
    fs.writeFileSync(cacheFilePath, JSON.stringify(emojiCache, null, 2), 'utf8');
}

function adicionarEmoji(nome, emoji) {
    carregarCache();
    emojiCache[nome] = emoji;
    salvarCache();
}

function editarEmoji(numero, novoEmoji) {
    carregarCache();
    if (numero in emojiCache) {
        emojiCache[numero] = novoEmoji;
        salvarCache();
    }
}

function obterEmoji(numero) {
    carregarCache();
    return emojiCache[numero] || null;
}

function obterTodosEmojis() {
    carregarCache();
    return Object.entries(emojiCache).map(([numero, emoji]) => `${numero} - ${emoji}`);
}

function verificarEmoji(numero) {
    carregarCache();
    return numero in emojiCache;
}

module.exports = { obterEmoji, editarEmoji, adicionarEmoji, carregarCache, obterTodosEmojis, verificarEmoji };