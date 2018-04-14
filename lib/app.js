const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express();
mongoose.connect(process.env.MONGODB_URI);

app.post('/api/signup', express.json(), (req, res) => {

    User.isUnique(req.body)
        .then(user => {

            User.create(req.body)
                .then(user => res.send(user))
                .catch(err => res.status(400).send(err));

        }).catch(err => res.status(400).send(err));

});

app.get('/foo', (req, res) => {
    res.send('bar');
});

app.get('/api/signin', (req, res) => {

    let authHeader = req.get('Authorization');
    let payload = authHeader.split('Basic ')[1];
    let decoded = Buffer.from(payload, 'base64').toString();
    let [username, password] = decoded.split(':');

    User.findOne({
        username
    }).then(user => {
        user.checkPassword(password)
            .then((result) => {

                if (result) {
                    const token = jwt.sign({
                        id: user._id,
                        username: user.username
                    }, 'SECRET');
                    res.status(200).send({
                        token
                    });
                } else {
                    res.sendStatus(401);
                }
            })

    })

})

app.get('/basic-authorized', basicAuth, (req, res) => {

    if (req.user) {
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }

})

app.get('/bearer-authorized', bearerAuth, (req, res) => {
    if (req.user) {
        res.status(200).send('yippee');
    } else {
        res.status(401).send('nope');
    }
})

function basicAuth(req, res, next) {

    let authHeader = req.get('Authorization');
    let payload = authHeader.split('Basic ')[1];
    let decoded = Buffer.from(payload, 'base64').toString();
    let [username, password] = decoded.split(':');

    User.findOne({
        username
    }).then(user => {
        user.checkPassword(password)
            .then((result) => {
                if (result) {
                    req.user = user;

                }
                next();
            })

    })
}

function bearerAuth(req, res, next) {
    let authHeader = req.get('Authorization');

    if (!authHeader) {
        next();
    }
    let token = authHeader.split('Bearer ')[1];

    jwt.verify(token, 'SECRET', (err, decoded) => {
        User.findOne({
                username: decoded.username
            })
            .then(user => {
                req.user = user;
                next();
            });
    })
}


module.exports = app;