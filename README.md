# Testing Express/Mongoose with Basic and Bearer Authentication



## Uses [Mockgoose](https://www.npmjs.com/package/mockgoose) and [SuperTest](https://www.npmjs.com/package/supertest) so can run without DB connection or running server

*Steps to Run*

* npm install
* create .env file
	* MONGODB_URI=mongodb://localhost/whatever
	* SECRET=whatever
* npm test

* NOTE: Neither the Express app nor MongoDB need to be running thanks to Mockgoose and SuperTest

Bonus: A wallaby.js file is included in case you use the awesomeness that is [Wallaby](https://wallabyjs.com/)
