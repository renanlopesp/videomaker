const fs = require('fs')
const contenFilePath = './content.json'

function save(content) {
    const contentString = JSON.stringify(content)
    return fs.writeFileSync(contenFilePath, contentString)
}
function load() {
    const fileBuffer = fs.readFileSync(contenFilePath, 'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

module.exports = {
    save,
    load,
}
