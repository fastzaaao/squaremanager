const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { adicionarEmoji, carregarCache } = require('./emojiCache');
const AllEmojis = require('./emojis.json');

async function fetchEmojis(client) {
    const response = await axios.get(`https://discord.com/api/v9/applications/${client.user.id}/emojis`, {
        headers: { Authorization: `Bot ${client.token}` }
    });
    return response.data.items;
}

async function createEmoji(client, name, image) {
    try {
        const response = await axios.post(
            `https://discord.com/api/v9/applications/${client.user.id}/emojis`,
            { name, image },
            { headers: { Authorization: `Bot ${client.token}` } }
        );
        adicionarEmoji(name, `<:${name}:${response.data.id}>`);
        return `<:${name}:${response.data.id}>`;
    } catch (error) {
        console.error(`Erro ao criar emoji "${name}":`, error.response?.data || error.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyAndUploadEmojis(client) {
    carregarCache();
    const cachePath = path.join(__dirname, 'emojisCache.json');
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const emojis = await fetchEmojis(client);
    const existingNames = new Set(emojis.map(e => e.name));

    for (const [name, emojiStr] of Object.entries(cache)) {
        if (!existingNames.has(name)) {
            const emojiData = AllEmojis.find(e => (e.name || e.nome) === name);
            if (emojiData) {
                console.log(`[EMOJIS] Emoji "${name}" não encontrado no Discord. Fazendo upload novamente...`);
                await createEmoji(client, name, emojiData.image, emojiData.animated || false);
                await sleep(400);
            } else {
                console.warn(`[EMOJIS] Emoji "${name}" não encontrado em emojis.json, não será possível re-uploadar.`);
            }
        }
    }
}

module.exports = { verifyAndUploadEmojis };