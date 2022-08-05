const generateMessage = function (userName, message) {
    return {
        userName,
        message,
        createdAt: new Date().getTime()
    }
}

const generateLocation = function (userName, url) {
    return {
        userName,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocation
}