const jwt = require('jsonwebtoken')
const User = require('../models/user')
require('dotenv').config();

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // const user = await User.findOne({ _id: decoded._id, 'tokens.token': token})
        const user = await User.findById(decoded._id);

        if (!user) {
            throw new Error
        }

        const tokenMatch = user.tokens.find(t => t.token === token);
        if (!tokenMatch) {
            throw new Error();
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({error: "Please signup or login"})
    }
}

module.exports = auth