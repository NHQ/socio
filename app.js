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
	, fs = require('fs')
	, url = require('url')
	, query = require('querystring')
	, http = require('http')
	, user= require('./user-model');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
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
var Schema = mongoose.Schema;
var Links = new Schema({
	text: String,
	media: Array,
	href: String
})
var Menu = new Schema({
	title: String,
	media: {_id: String, elements: Array}, //each array item is an element object
	link: [Links]
})
var Person = new Schema({
	fname: String,
	mname: String,
	lname: String,
	gender: String,
	location: String,
	articles: [Article],
	fb_id: String,
	access_token: String,
	bio: String
});
var Media = new Schema({
	content:
	{
		title: String,
		description: String, 
		doc_type: String,
		caption: String,
		path: String, 
		thumb: String, 
		medium: String,
	},
	meta:
	{
		authors: [Person],
		meta: String, //json
		copyright: String,
		pub_date: Date,
		last_edit: Date		
	},
	style:
	{
		template: String,
		theme: String,
		//css:[CSS]
	},
});

var Discussion = new Schema({
	title: String,
	author: [Person],
	text: String,
	media: Array,
	discussion: [Discussion],
	pub_date: Date,
	last_edit: Date
});
var Article = new Schema({
	content: 
	{
		title: String,
		subTitle: String,
		blurb: String,
		text: String,		
	},
	media: Array,
	meta:
	{
		//geo: { loc : { long : x, lat: y } },
		geo_name: String,		
		last_edit: { type: Date, required: true, default: new Date() },
		pub_date: Date,
		volume: String,
		issue: Number,
		publisher: String,
		contributors: [Person],	
		slug: String,
		channels: Array,
		subjects: Array,
		contact: String,
	},
	style:
	{
		template: String,
		theme: String,
		//css:[CSS]
	},
	discussion: [Discussion],
});

mongoose.model('Article', Article);
mongoose.model('Discussion', Discussion);
mongoose.model('Media', Media);
mongoose.model('Person', Person);
mongoose.model('Menu', Menu);
mongoose.model('Links', Links);

// Routes
/*
function upDoc(_id, keys){
	// keys is an obj
	var building = mongoose.model('building');
	building.update({_id: _id}, keys, function (err, res, doc){
		console.log(err);
		console.log(res);
		console.log(doc)
	})
}
function getDoc(_id){
	var building = mongoose.model('building');
	doc = building.findById(_id, function (err, doc){
		console.log(doc);
		if(!err) return doc;
	})
}
function newImg (){
	var image = mongoose.model('Images');
	doc = new image();
	doc.name = "New image"
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)
		{
			console.log(doc._id);
		}
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
*/

function upDoc(id, field, key, valu){
	// keys is an obj
	var article = mongoose.model('Article');
	article.findById(id, function (err, doc){
		doc[field][key] = valu;
		doc.save(function (err, res){
			console.log(err);
			console.log(res)	
		});
	})
}
function newMedia (doc_type, info){
	var media = mongoose.model('Media');
	var doc = new Media();
	doc.doc_type = doc_type;
	doc.meta = info.uploads.meta; //an object
};

function newDoc (req, res, next){
	var media = mongoose.model('Article');
	var doc = new media();
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)
		{
			console.log(doc._id);
			req.facts = doc;
			next();
		}
	})
};
function newPerson (req, res, next){
	var media = mongoose.model('Person');
	var doc = new media();
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)
		{
			console.log(doc._id);
			req.facts = doc;
			next();
		}
	})
};
app.post('/update', function(req,res){
	res.writeHead('200');
	var _id = req.query._id
	, key = req.query.key
	, valu = req.query.valu
	, field = req.query.field;
	upDoc(_id, field, key, valu);
		res.end();
});

app.post('/upload', function (req, res){
	res.writeHead('200');
	res.end();
	var info = req.body;
	console.log(req.headers);
	console.log(info);

});

app.get('/admin', newPerson, function(req, res){
	console.log(req.facts)
  	res.render('index', {locals:
    	{
			title: 'Admin',
			doc: req.facts,
			content: _.keys(Article.tree.content),
			meta: _.keys(Article.tree.meta),
			media: Article.tree.media,
			tranny: {
	  			"auth": 
				{
	    			"key": "b2841a053d384302bf39b2ab4dbc88ec"
	  			},
	  			"template_id": "6f8d596087084fc18cfaa9924801e17c",
	  			"redirect_url": "http://72.2.117.15/admin",
				"notify_url": "http://72.2.117.15/upload"
			}
		}
  });
});

app.get('/', function(req, res){
  res.render('front', {
    title: 'Welcome'
  });
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
console.log(_.keys(Article.tree.content));