const supertest = require('supertest');
const app = require('../lib/app');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const bcrypt = require('bcryptjs');
const SIGNUP_URL = '/api/signup';
const SIGNIN_URL = '/api/signin';
const jwt = require('jsonwebtoken');
require('dotenv').config()

const request = supertest(app);

mockgoose.prepareStorage().then(function () {
    // mongoose connection	
    mongoose.connect('mongodb://localhost/bearable');
});


function getUserParams() {
    // randomize to avoid duplicate user errors
    return {
        username: 'bill' + Math.random(),
        email: 'bill@microsoft.com' + Math.random(),
        password: 'windows95'
    };
};

function signUp(params) {
    return request.post(SIGNUP_URL)
        .set('Content-Type', 'application/json')
        .send(params)
}

function signIn(params) {

    let payload = params['username'] + ':' + params['password'];

    let encoded = btoa(payload);

    return request.get(SIGNIN_URL)
        .set('Authorization', 'Basic ' + encoded);
}

async function signUpAndIn() {

    let params = getUserParams();

    await signUp(params);

    return signIn(params); 
}

afterEach(() => {
    return mockgoose.helper.reset()
})

describe('/api/signup', () => {

    it('should return status 400 if missing username', async () => {
        
        let params = getUserParams();
        
        delete params['username'];

        const response = await signUp(params);

        expect(response.status).toBe(400);
                
    });

    it('should return status 400 if missing email', async () => {
        
        let params = getUserParams();
        
        delete params['email'];

        const response = await signUp(params);

        expect(response.status).toBe(400);
    });

    it('should return status 400 if missing password', async () => {

        let params = getUserParams();
        
        delete params['password'];

        const response = await signUp(params);

        expect(response.status).toBe(400);
    });

    it('should return 400 is username already used', async () => {
        
        let params = getUserParams();

        await signUp(params);

        params.email += "something different";

        const response = await signUp(params);

        expect(response.status).toBe(400);
    });

    it('should return 400 if email already used', async () => {
        
        let params = getUserParams();

        await signUp(params);

        params.username += "something different";
        
        const response = await signUp(params);

        expect(response.status).toBe(400);

    });

    it('should return status 200 with successful request', async () => {

        let params = getUserParams();

        const response = await signUp(params);

        expect(response.status).toEqual(200);
        
        expect(response.body.password).not.toBe(params.password);
        
        expect(bcrypt.compareSync(params.password, response.body.password));
    });        
});

describe('/api/signin', () => {

    it('should return 401 unauthorized if password is incorrect', async () => {
        
        let params = getUserParams();

        await signUp(params);

        // intentionally set the password as a wrong password
        params.password = params.password + 'wrong';

        const response = await signIn(params);

        expect(response.status).toBe(401);
    });

    it('should return 200 if username and password are ok', async () => {

        const response = await signUpAndIn();

        expect(response.status).toBe(200);
    });

    it('should get good token if username and password are ok', async () => {

        let params = getUserParams();

        const signUpResponse = await signUp(params);

        expect(signUpResponse.status).toBe(200);

        const userId = signUpResponse.body._id;

        const signInResponse = await signIn(params);

        expect(signInResponse.status).toBe(200);

        expect(signInResponse.body.token).toBeDefined();

        expect(jwt.verify(signInResponse.body.token, process.env.SECRET).id).toBe(userId);
                
    });

    it('should return 400 if username or password are not ok at protected route', async () => {
        
        let params = getUserParams();

        await signUp(params);

        await signIn(params);

        params.password += 'mangled';

        let payload = params['username'] + ':' + params['password'];
        
        let encoded = btoa(payload);

        const response = await request
            .get('/basic-authorized')
            .set('Authorization', 'Basic ' + encoded);

        expect(response.status).toBe(400);
        
    });

    it('should return 400 if token missing at ultra protected route', async () => {
        
        await signUpAndIn();

        const response = await request.get('/bearer-authorized');

        expect(response.status).toBe(401);
    });

    it('should return 200 if token good at bearer authorized route', async () => {

        const signInResponse = await signUpAndIn();

        const token = signInResponse.body.token;

        const response = await request
            .get('/bearer-authorized')
            .set('Authorization', 'Bearer ' + token);

        expect(response.status).toBe(200);

    });
});