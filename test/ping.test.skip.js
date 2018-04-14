const request = require('supertest');
const app = require('../app');
const User = require('../lib/models/user');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);

mockgoose.prepareStorage().then(function () {
    // mongoose connection	
    mongoose.connect('mongodb://localhost/unbearable');
});

it.skip('should create user', done => {
    const user = User.create({
        username: 'foo',
        password: 'bar'
    }).then(user => {
        expect(user.username).toBe('foo');
        expect(user.password).toBe('bar');
        done();
    })
});

it('Ping should pong', done => {
    request(app)
        .get('/ping')
        .then(response => {
            expect(response.text).toBe('pong')
            done();
        });
});

function getUserParams() {
    // using + Math.rabdom() to avoid duplicate user errors
    return {
        username: 'bill' + Math.random(),
        email: 'bill@microsoft.com' + Math.random(),
        password: 'windows95'
    };
};

function signUp(newUser) {

    return request(app).post('/api/signup') // POST to api/signup
        .set('Content-Type', 'application/json')
        .auth(newUser.username, newUser.password)
        .send(JSON.stringify(newUser))
}

describe('Handle valid authorization', () => {


    it('should sign up new user with valid creds', done => {

        let newUser = getUserParams();

        signUp(newUser).end((err, res) => {
            
            if (err) {
                console.error(err);
                fail();
            }
            expect(res.status).toBe(200);
            done();
        })

    });
});