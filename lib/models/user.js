const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

schema.pre('save', function(next) {
    if(this.isNew) {
        bcrypt.hash(this.password, 10, (err, hash) => {
            this.password = hash;
            this.passwordHash = hash;
            next();
        });

    }
})

schema.methods.checkPassword = function(attempt) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(attempt, this.password, (err, valid) => {
            if (err) {
                reject(err);
            }
            resolve(valid);
        })
    })
}

// TODO better as custom validator
schema.statics.isUnique = function(creds) {
    return new Promise((resolve, reject) => {
        this.find()
        .or([{username:creds.username},{email:creds.email}])
        .then(users => {
            if(users.length) {
                reject('name and email must be unique')
            } else {
                resolve();
            }
        })
    })
}

module.exports = mongoose.model('User', schema);