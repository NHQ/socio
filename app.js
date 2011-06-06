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
var _ = require('underscore');

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

function newDoc (){
	var building = mongoose.model('building');
	var doc = new building();
	doc.name = "First Name"
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)console.log(doc)
	})
}

app.get('/admin', function(req, res){
	newDoc();
  res.render('index', {
    title: 'Admin'
  });
});

app.get('/', function(req, res){
	newDoc();
  res.render('index', {
    title: 'New Building'
  });
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
console.log(_.keys(building.paths));
