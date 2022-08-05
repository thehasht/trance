const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate (value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid Email')
            }
        }
    },

    password: {
        type: String,
        required: true,
        trim: true,
        validate (value) {
            if (value.length < 7) {
                throw new Error('Invalid Password')
            }
        }
    },

    friends: [{
        name: {
            type: String,
            required: true
        }, 
        email: {
            type: String,
            required: true
        }
    }]

}, {
    timestamps: true
})

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }

    next()
})

userSchema.methods.addFriend = async function (friendDetails) {
    const user = this

    user.friends = user.friends.concat({
        name: friendDetails.name,
        email: friendDetails.email
     })
    await user.save()
}

userSchema.statics.findByCredentials = async function (credentials) {
    const user = await User.findOne({ email: credentials.email })

    if (!user) {
        throw new Error('Invalid Credentials')
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password)

    if (!isMatch) {
        throw new Error('Invalid Credentials')
    }

    return user
}

const User = mongoose.model('User', userSchema)

module.exports = {
    User
}