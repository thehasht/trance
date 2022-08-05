const mongoose = require('mongoose')

const recordSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true, 
        trim: true,
        unique: true
    },

    connection_id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    }

}, {
    timestamps: true
})

const Record = mongoose.model('Record', recordSchema)

module.exports = {
    Record
}