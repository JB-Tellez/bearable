# Testing Express/Mongoose with Basic and Bearer Authentication

--

## Uses Mockgoose and SuperTest so can run without DB connection or running server

*Steps to Run*

* npm install
* create .env file
	* set MONGODB_URI to something like mongodb://localhost/test
	* set SECRET to whatever you like
* NOTE: Neither the Express app nor MongoDB need to be running thanks to Mockgoose and SuperTest
* Run Jest

Bonus: A wallaby.js file is included in case you use that awesomeness
