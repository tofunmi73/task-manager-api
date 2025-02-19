const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()


router.post("/tasks", auth, async (req, res) => {
    // const task = new Task(req.body)

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(error)
    }
    
})

router.get('/tasks', auth, async (req, res) => {

    try {
        const match = {}; // Initialize an empty match object
        const sort = {}

        if (req.query.completed) {
            match.completed = req.query.completed === 'true'; // Convert string to boolean
        }

        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        match.owner = req.user._id; // Always filter by owner
        const tasks = await Task.find(match, null, {
            limit: parseInt(req.query.limit) || undefined,
            skip: parseInt(req.query.skip) || undefined,
            sort
        })
        res.send(tasks)
    } catch (e) {
        res.status(500).send()
    }
    
})


router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        
        const tasks = await Task.findOne({_id, owner: req.user._id})

        if (!tasks) {
            return res.status(404).send()
        }

        res.send(tasks)
    } catch (e) {
        res.status(500).send()
    }

   
})


router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const tasks = await Task.findOne({_id: req.params.id, owner: req.user._id})
      

        if (!tasks) {
            return res.status(404).send()
        }

        updates.forEach((update) => {
            tasks[update] = req.body[update]
          });

        await tasks.save()

        res.send(tasks)
    } catch (e) {
        res.status(400).send(e)
    }    

})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if(!task) {
            res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router