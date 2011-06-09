/**
 * NOTES
	* Possible idea for other Sabina website: property picks a la blog
*/
/**
 * Module dependencies.
 */

var express = require('express'),
	mongoose = require('mongoose');	
	mongoose.connect('mongodb://localhost/test');
var _ = require('underscore')
	, request = require('request')
	, fs = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Models
var schema = mongoose.Schema;
var Images = new schema({
	title: String,
	desscription: String,
	filepath: String, 
	thumb: String
});
var building = new schema({
	name: String,
	address: String,
	description: String,
	year_built: Number,
	architect: String,
	zoning: String,
	neighborhood: String,
	list_price: Number,
	taxes: String,
	contact: String,
	owner: String,
	floor_plan: {description: String, pictures: [Images]}, 
	pictures: [Images],
	sections: {name: String, description: String, pictures: [Images]}	
});

mongoose.model('Images', Images);
mongoose.model('building', building);

// Routes
function saveDoc(_id, keys){
	// keys is an obj
	var building = mongoose.model('building');
	building.update({_id: _id}, keys, function (err, res, doc){
	})
}
function getDoc(_id){
	var building = mongoose.model('building');
	doc = building.findById(_id, function (err, doc){
		if(!err) return doc
	})
}

function newDoc (){
	var building = mongoose.model('building');
	doc = new building();
	doc.name = "New Building"
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)
		{
			console.log(doc._id);
		}
	})
}

app.post('/uploads', function (req, res){
	res.writeHead('200');
	var _id = req.query._id;
	getDoc(_id);
	var info = req.body;
	console.log(info);
	request({
		uri: info.uploads.ur		
	}, function(err, res, body){
		 if (!error && response.statusCode == 200)
		{
			fs.writeFile(info.uploads.name, body, function (err){
				if(err)
				console.log(err);
				else console.log('saved')
			})
		}
	})
	
})

app.get('/admin', function(req, res){
	newDoc()
  	res.render('index', {locals:
    	{
			title: 'Admin',
			doc: doc,
			tranny: {
	  			"auth": 
				{
	    			"key": "b2841a053d384302bf39b2ab4dbc88ec"
	  			},
	  			"template_id": "6f8d596087084fc18cfaa9924801e17c",
	  			"redirect_url": "http://72.2.117.15/upload?_id="+doc._id
			}
		}
  });
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'New Building'
  });
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
console.log(_.keys(building.paths));
