const algorithmia = require('algorithmia')
const algorithmiaKey = require('../keys/algorithmiaKey.json').algorithmia_key
const sentenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../keys/imbkey.json').apikey
const { IamAuthenticator } = require('ibm-watson/auth')
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
    version: '2018-03-05',
    url:
        'https://gateway.watsonplatform.net/natural-language-understanding/api/',
})

const state = require('./state')

async function robot() {
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentence(content)
    await fetchKeywordsOfAllSentences(content)

    state.save(content)

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

    //Limite de sentenças
    function limitMaximumSentence(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    // Adiciona keywords ao texto
    async function fetchKeywordsOfAllSentences(content) {
        for (const sentence of content.sentences) {
            sentence.keywords = await fetchWatsonAndReturnKeywords(
                sentence.text
            )
        }
    }

    //Watsom
    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze(
                {
                    text: sentence,
                    features: {
                        keywords: {},
                    },
                },
                (error, response) => {
                    if (error) {
                        throw error
                    }
                    const keywords = response.result.keywords.map(keyword => {
                        return keyword.text
                    })
                    resolve(keywords)
                }
            )
        })
    }
}

module.exports = robot
