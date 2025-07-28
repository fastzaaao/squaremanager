const axios = require('axios');
const { adicionarEmoji, carregarCache } = require('./emojiCache');
const AllEmojis = require('./emojis.json');

async function fetchEmojis(client) {
    const response = await axios.get(`https://discord.com/api/v9/applications/${client.user.id}/emojis`, {
        headers: { Authorization: `Bot ${client.token}` }
    });
    return response.data.items;
}

async function createEmoji(client, name, image, animated = false) {
    try {
        const response = await axios.post(
            `https://discord.com/api/v9/applications/${client.user.id}/emojis`,
            { name, image, animated },
            { headers: { Authorization: `Bot ${client.token}` } }
        );
        adicionarEmoji(name, `<${animated ? 'a' : ''}:${name}:${response.data.id}>`);
        return `<${animated ? 'a' : ''}:${name}:${response.data.id}>`;
    } catch (error) {
        console.error(`Erro ao criar emoji "${name}":`, error.response?.data || error.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function UploadEmojis(client) {
    carregarCache();
    const emojis = await fetchEmojis(client);
    const existingNames = new Set(emojis.map(e => e.name));
    const cache = require('./emojisCache.json');
    const cacheNames = new Set(Object.keys(cache));

    for (const emoji of AllEmojis) {
        const name = emoji.name || emoji.nome;
        if (!name) continue;
        if (!existingNames.has(name) && !cacheNames.has(name)) {
            const emojiData = AllEmojis.find(e => (e.name || e.nome) === name);
if (emojiData) {
    await createEmoji(client, name, emojiData.image, emojiData.animated || false);
    await sleep(400);
}
        }
    }
}

module.exports = { fetchEmojis, createEmoji, UploadEmojis };