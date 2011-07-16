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
	, user = require('./user-model')
	, redis = require('redis')
	, MemoryStore = require('connect').session.MemoryStore 
	,  crypto = require('crypto')
	, RedisStore = require('connect-redis')(express)
    , fb = require('facebook-js');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'superSecret!', cookie: {maxAge: 60000 * 20}, store: new RedisStore()}));
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

function getSesh (req, res, next){
	if(!req.session._id)
		res.redirect('/login');
	if(req.session._id)
	{
		var person = mongoose.model('Person');
		person.findById(req.session._id, function (err, individual){
			if (err){console.log(err)}
			req.session.regenerate(function(err){
				console.log(individual.doc.facts);
				req.session._id = individual._id;
				req.facts = individual.doc.facts
				req.person = individual;
				next()
			})
		})}
};

function getUser(_id){
	var person = mongoose.model('Person');
	person.findById(_id, function (err, individual){
		if (err){console.log(err)}
		var dude = individual;
		console.log(dude._id);
		return dude
	})
}

function upDoc(id, field, key, valu){
	// keys is an obj
	var article = mongoose.model('Article');
	article.findById(id, function (err, doc){
		if (err){console.log(err)};
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
			req.doc = doc;
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
			req.doc = doc;
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

app.get('/profile', getSesh, function(req, res){
	res.render('profile', {locals:{
			title: 'Admin',
			facts: req.facts,
	}})
})

app.get('/new', getSesh, newDoc, function(req, res){
	console.log(_.keys(user.models('Article').tree.content));
  	res.render('index', {locals:
    	{
			title: 'Admin',
			doc: req.doc,
			content: _.keys(user.models('Article').tree.content),
			meta: _.keys(user.models('Article').tree.meta),
			media: _.keys(user.models('Article').tree.media),
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

// USERS and SESSIONS
app.get('/logout', function(req, res){
	req.session.destroy;
	res.redirect('/login')
})
app.post('/login', function(req, res){
	user.user(req.body.email, req.body.password, req)
	req.session._id = newUser._id;
	res.redirect('/logged')
});
app.get('/logged', getSesh, function(req, res){
	res.render('logged', {layout: false, locals: {
		title: 'OMEGAWD',
		sesh: req.session._id
	}})
})
app.get('/login', function (req, res){
	res.render('login', {layout: false, locals:{title: 'OMEGAWD'}})
});
app.get('/', function(req, res){
  res.render('front', {
    title: 'Welcome'
  });
});

app.get('/fb', function (req, res) {
  res.redirect(fb.getAuthorizeUrl({
    client_id: '230413970320943',
    redirect_uri: 'http://72.2.117.15/auth',
    scope: 'offline_access,publish_stream'
  }));
});

app.get('fb/auth', function (req, res) {
  fb.getAccessToken('230413970320943', 'appSecret', req.param('code'), 'http://72.2.117.15/auth', function (error, access_token, refresh_token) {
    res.render('client', {access_token: access_token, refresh_token: refresh_token});
  });
});

app.post('fb/message', function (req, res) {
  fb.apiCall('POST', '/me/feed',
    {access_token: req.param('access_token'), message: req.param('message')},
    function (error, response, body) {
      res.render('done', {body: body});
    }
  );
});

app.get('fb/messages', function (req, res) {
  var stream = fb.apiCall('GET', '/me/feed', {access_token: req.param('access_token'), message: req.param('message')});
  stream.pipe(fs.createWriteStream('backup_feed.txt'));
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);