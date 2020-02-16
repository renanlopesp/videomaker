const algorithmia = require('algorithmia')
const algorithmiaKey = require('../keys/algorithmiaKey.json').algorithmia_key

function robot(content) {
    fetchContentFromWikipedia(content)
    // sanitizeContent(content)
    // breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo(
            'web/WikipediaParser/0.1.2?timeout=300'
        )
        const wikipediaResponse = await wikipediaAlgorithm.pipe(
            content.searchTerm
        )
        const wikipediaContent = wikipediaResponse.get()

        console.log(wikipediaContent)
    }
}

module.exports = robot
