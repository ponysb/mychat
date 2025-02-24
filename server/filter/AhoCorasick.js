const { Mint } = require('mint-filter')
var sensitiveWord = require('./words.js');
const mint = new Mint(sensitiveWord)

async function wordFilter(text) {
  return mint.filter(text)
}

module.exports = { wordFilter }