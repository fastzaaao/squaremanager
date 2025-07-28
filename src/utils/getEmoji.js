function getEmoji(value, fallback) {
  return value && value.trim() ? value : fallback;
}

module.exports = getEmoji;