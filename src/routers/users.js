const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const { sendEmail, byeEmail } = require('../emails/account.js')


router.post('/users', async (req, res) =>{
    const user = new User(req.body)

    try {
        await user.save()
        sendEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        if (e.code === 11000 && e.keyPattern && e.keyPattern.email === 1) {
            res.status(400).send({ error: 'Email already exists' });
        } else {
            console.error("Registration error:", e);
            res.status(400).send({ error: 'Something went wrong' });
        }
    }
    
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken()
        res.send({user, token}); // Send the user object on successful login
        
    } catch (e) { 
        res.status(400).send({ error: 'Invalid login credentials' }); 
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {

    res.send(req.user)
    
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
                
        updates.forEach((update) => {
            if (update === 'password') {
              req.user.password = req.body.password; // Assign the new password
            } else {
              req.user[update] = req.body[update]; //For other fields, direct assignment is fine.
            }
          });

        await req.user.save()
                                    
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// router.delete('/users/me', auth, async (req, res) => {
//     try {
        
//         await req.user.remove()
//         console.log(req.user)
//         byeEmail(req.user.email, req.user.name)
//         res.send(req.user)
//     } catch (e) {
//         console.error("Error deleting user:", e);
//         res.status(500).send({ error: e.message })
//     }
// })

router.delete('/users/me', auth, async (req, res) => {
    try {
        // 1. Retrieve the user from the database using Mongoose
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // 2. Now you can safely use remove()
        await user.deleteOne();
        byeEmail(user.email, user.name); // Use the 'user' object here too
        res.send({ message: 'User deleted successfully' }); // Send a success message
    } catch (e) {
        console.error("Error deleting user:", e);
        res.status(500).send({ error: e.message });
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
            return cb(new Error('File format not supported'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router