const algorithmia = require('algorithmia')
const algorithmiaKey = require('../keys/algorithmiaKey.json').algorithmia_key
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo(
            'web/WikipediaParser/0.1.2?timeout=300'
        )
        const wikipediaResponse = await wikipediaAlgorithm.pipe(
            content.searchTerm
        )
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkDown = removeBlankLinesAndMarkdown(
            content.sourceContentOriginal
        )
        const withoutDatesInParentheses = removeDatesInParentheses(
            withoutBlankLinesAndMarkDown
        )

        content.sourceContentSanitized = withoutDatesInParentheses

        // Remove Linhas brancas e Markdowns
        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkDown = allLines.filter(line => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutBlankLinesAndMarkDown.join(' ')
        }
    }

    //Remove Datas
    function removeDatesInParentheses(text) {
        return text
            .replace(/\((?:\([^()]*\)|[^()])*\)/gm, '')
            .replace(/  /g, ' ')
    }

    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(
            content.sourceContentSanitized
        )
        sentences.forEach(sentence => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: [],
            })
        })
    }
}

module.exports = robot
