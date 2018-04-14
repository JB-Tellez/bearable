const request = require('supertest');
const app = require('../lib/app');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const bcrypt = require('bcryptjs');
const SIGNUP_URL = '/api/signup';
const SIGNIN_URL = '/api/signin';
const jwt = require('jsonwebtoken');
require('dotenv').config()

mockgoose.prepareStorage().then(function () {
    // mongoose connection	
    mongoose.connect(process.env.MONGODB_URI);
});

it('foo should bar', () => {
    return request(app).get('/foo').then(response => {
        expect(response.text).toBe('bar');
    });
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
    return request(app).post(SIGNUP_URL)
        .set('Content-Type', 'application/json')
        .send(params)
}

function signIn(params) {
    
    let payload = params['username'] + ':' + params['password'];
    
    let encoded = btoa(payload);

    return request(app).get(SIGNIN_URL)
        .set('Authorization', 'Basic ' + encoded);
}

afterEach(() => {
    return mockgoose.helper.reset()
})

describe('/api/signup', () => {
    it('should return status 400 if missing username', (done) => {
        let params = getUserParams();
        delete params['username'];

        signUp(params)
            .then(response => {
                expect(response.status).toBe(400);
                done();
            });
    });

    it('should return status 400 if missing email', (done) => {
        let params = getUserParams();
        delete params['email'];

        signUp(params)
            .then(response => {
                expect(response.status).toEqual(400);
                done();
            });
    });

    it('should return status 400 if missing password', (done) => {
        let params = getUserParams();
        delete params['password'];

        signUp(params)
            .then(response => {
                expect(response.status).toEqual(400);
                done();
            });
    });
 
    it('should return 400 is username already used', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(() => {
                params.email += "something different"
                signUp(params).then(res => {
                    expect(res.status).toBe(400);
                    done();
                })
            });
    })

    it('should return 400 if email already used', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(() => {
                params.username += "something different";
                signUp(params).then(res => {
                    expect(res.status).toBe(400);
                    done();
                })
            });
    })
    it('should return status 200 with successful request', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(res => {
                expect(res.status).toEqual(200);
                expect(res.body.password).not.toBe(params.password);
                expect(bcrypt.compareSync(params.password, res.body.password));
                done();
            });
    });
});

describe('/api/signin', () => {

    it('should return 401 unauthorized if password is incorrect', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(res => {

                // intentionally set the password as a wrong password
                params.password = params.password + 'wrong';

                return signIn(params);
            })
            .then(response => {
                expect(response.status).toBe(401);
                done();
            });
    });


    it('should return 200 if username and password are ok', (done) => {
        let params = getUserParams();

        let userId;

        signUp(params)
            .then(res => {
                expect(res.status).toBe(200);

                userId = res.body._id;

                return signIn(params);
            })
            .then(res => {
                expect(res.status).toBe(200);
                expect(res.body.token).toBeDefined();
                expect(jwt.verify(res.body.token, process.env.SECRET).id).toBe(userId);
                done();
            });
    });

    it('should return 200 if username and password are ok at basic authorized route', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(res => {
                return signIn(params);
            })
            .then(res => {
                expect(res.status).toBe(200);
                done();
            });
    });

    it('should return 400 if username or password are not ok at protected route', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(() => signIn(params))
            .then(res => {
                expect(res.status).toBe(200);

                params.password += 'mangled';

                let payload = params['username'] + ':' + params['password'];
                let encoded = btoa(payload);

                return request(app).get('/basic-authorized')
                    .set('Authorization', 'Basic ' + encoded);
            })
            .then(res => {
                expect(res.status).toBe(400);
                done();
            });
    });

    it('should return 400 if token missing at ultra protected route', (done) => {
        let params = getUserParams();

        signUp(params)
            .then(() => signIn(params))
            .then(res => {
                
                request(app).get('/bearer-authorized')
                    .then(result => {
                        expect(result.status).toBe(401)
                        done();
                    });
                
            });
    });

    it('should return 200 if token good at bearer authorized route', (done) => {
        
        let params = getUserParams();

        signUp(params)
            .then(() => signIn(params))
            .then(res => {
                
                const token = res.body.token;

                request(app).get('/bearer-authorized')
                    .set('Authorization', 'Bearer ' + token)
                    .then(result => {
                        expect(result.status).toBe(200)
                        done();
                    });
                
            });
    });
});