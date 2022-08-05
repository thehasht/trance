const express = require('express')
const router = new express.Router()
const User = require('../models/user.js')
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')

router.post('/users', async function (req, res) {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send({ error })
    }  

})

router.post('/users/login', async function (req, res) {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
    } catch (error) {
        res.status(400).send({ error })
    }
})

router.post('/users/logout', auth, async function (req, res) {
    
    try {
        req.user.tokens = req.user.tokens.filter(function (token) {
            return req.token !== token.token
        })
        await req.user.save()

        res.status(200).send({ status: 'Logged Out'})
    } catch (error) {
        res.status(500).send({ error })
    }

})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter (req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload a JPG or JPEG or PNG image file.'))
        }

        callback(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async function (req, res) {
    const buffer = await sharp(req.file.buffer).resize({ 
        width: 250,
        height: 250
    }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.status(200).send()
}, function (error, req, res, next) {
    res.status(400).send({ error: error.message })
})

router.post('/users/logoutAll', auth, async function (req, res) {

    try {
        req.user.tokens = []
        await req.user.save()

        res.status(200).send({ status: 'Logged out of all devices' })
    } catch (error) {
        res.status(500).send({ error })
    }

})

router.get('/users/me', auth, async function (req, res) {

    res.status(200).send(req.user)

})

router.get('/users/:id/avatar', async function (req, res) {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.status(200).send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

router.patch('/users/me', auth, async function (req, res) {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(function (update) {
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates' })
    }

    try {
        updates.forEach(function (update) {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        
        res.status(200).send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }

})

router.delete('/users/me', auth, async function (req, res) {
    
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }

})

router.delete('/users/me/avatar', auth, async function (req, res) {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send()
})

module.exports = router