const  mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config();

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        min: 6,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('password cannot contain the word "password"')
            }
        }
    },
    age: {
        type: Number
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})


userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    console.log("Attempting login for email:", email); // Debugging
    const user = await User.findOne({ email });

    if (!user) {
        console.log("User not found."); // Debugging
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch); // Debugging

    if (!isMatch) {
        console.log("Password mismatch."); // Debugging
        throw new Error('Unable to login');
    }

    return user;
};

// hash plaintext password before saving.
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
    //   console.log('Original password:', user.password);
      try {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        user.password = hashedPassword; // Assign the hashed password
        // console.log('Hashed password:', user.password);
        // console.log('Password Length:', user.password.length);
        next(); // Call next only after successful hashing
      } catch (error) {
        console.error('Error hashing password:', error);
        next(error); // Pass the error to Mongoose for handling
      }
    } else {
      next(); //Skip if password is not modified
    }
  });

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User