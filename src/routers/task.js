const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const Task = require('../models/task.js')

router.post('/tasks', auth, async function(req, res){
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send()
    }
})

router.get('/tasks', auth, async function(req, res){
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
 
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.status(200).send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }

})

router.get('/tasks/:id', auth, async function(req, res){
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id})
        
        if(!task) {
            res.status(404).send()
        } else {
            res.status(200).send(task)
        }
    } catch(error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async function(req, res){
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(function(update){
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const task = Task.findOne({ _id: req.params.id, owner: req.user.id })
        if (!task) {
            return res.status(404).send()
        } 

        updates.forEach(function (update) {
            task[update] = req.body[update]
        })

        await task.save()
        res.status(200).send(task)
    } catch(error) {
        res.status(400).send(error)
    }
})

router.delete('./tasks/:id', auth, async function(req, res){
    try {
        const task = await User.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if(!task) {
            res.status(404).send()
        } else {
            res.status(200).send(task)
        }
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router