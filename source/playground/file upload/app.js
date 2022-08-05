const express = require('express')
const multer = require('multer')

const app = express()

const upload = multer({
    dest: 'images'
})

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/app.html')
})

app.post('/', upload.single('upload'), function (req, res) {
    res.send()
})

app.listen(3000, function (req, res) {
    console.log('Server running on port 3000')
})
