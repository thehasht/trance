const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

userSchema.plugin(AutoIncrement, {inc_field: 'number'})

const User = mongoose.model('User', userSchema)

module.exports = {
    User
}