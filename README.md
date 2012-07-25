#Appcelerator ACS API Node.js Module
A Node.js module that is a simple port of the Appcelerator ACS Javascript SDK to Node  


##Setup
Install the module  

	$ npm install appcelerator

Include it in package.json

	"dependencies": {
    	  "appcelerator": "*"
  	},


##Usage
Here are a couple of example routes for reading and setting a users status
  
	// get a user's statuses
	app.get('/status', function(req, res){

	    var app_key  = '1234';
	    var email    = 'ben.edmunds@gmail.com';
	    var password = '12345678';

	    var appcelerator = require('appcelerator')(app_key, email, password);

	    var data = {'user_id': '4f9eb57a0020440def0056d3'};

	    var output = appcelerator.sendRequest('statuses/query.json', 'GET', data, false, function(res){
	      
	      console.log(res.body);

	    });

	  });

	  // create a new status
	  app.get('/create_status', function(req, res){

	    // Create a user statuses
	    var app_key  = '1234';
	    var email    = 'ben.edmunds@gmail.com';
	    var password = '12345678';

	    var appcelerator = require('appcelerator')(app_key, email, password);

	    var data = {'message': 'node.js test message'};

	    var output = appcelerator.sendRequest('statuses/create.json', 'POST', data, false, function(res){
	      
	      console.log(res.body);

	    });

	  });


See [the Appcelerator documentation](http://cloud.appcelerator.com/docs/api/v1/statuses/info) for API details.

Module created by [Ben Edmunds](http://benedmunds.com) for [DblTap Labs](http://dbltaplabs.com).