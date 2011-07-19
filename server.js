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
    , fb = require('facebook-js')
	, formidable = require('formidable')
	, sys = require('sys');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'superSecret!', cookie: {maxAge: 60000 * 2000}, store: new RedisStore()}));
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
				// console.log(individual.doc.facts);
				req.session._id = individual._id;
				req.facts = individual.doc.facts
				req.person = individual;
				next()
			})
		})}
};

function getUser(req, res, next){
	var person = mongoose.model('Person'), dude;
	person.findById(req.session._id, function (err, individual){
		if (err){console.log(err)}
		dude = individual;
		console.log(dude);
	});
}

function upDoc(id, field, key, valu){
	// keys is an obj
	var article = mongoose.model('Person');
	article.findById(id, function (err, doc){
		if (err){console.log(err)};
		doc[field][key] = valu;
		doc.save(function (err, res){
			console.log(err);
			console.log(res)	
		});
	})
};
function getBlurbs(req, res, next){
	req.blurbs = [];
	var blurbi = mongoose.model('Blurb');
	var y = req.person.dossier.blurbi.length;
	for (x = 0; x < req.person.dossier.blurbi.length; x++)
		if (x === req.person.dossier.blurbi.length){next()};
		blurbi.findById(a, function (err, doc){
			if(!err){
				req.blurbs.push(doc)
			}
		})
};
function picload(id, valu){
	// keys is an obj
	var article = mongoose.model('Person');
	article.findById(id, function (err, doc){
		if (err){console.log(err)};
		doc.facts.portrait.pic = valu;
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
	user.save2user(req.session._id, doc._id);
	doc.save(function(err, doc){
		if(err){console.log(err)}
		if(doc)
		{
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
function appendDoc(_id, string, key){
	var nerd = mongoose.model('Person');
	nerd.findById(_id, function (err, doc){
		if(!err)
		{	
		doc.dossier[key].push(string);
		console.log(doc.dossier[key]);
		doc.save()
		}
	})
};
function newBlurb (req, res, next){
	var recBy = req.session._id
	,	recFor = req.params.person;
	var person =  mongoose.model('Person');
	var media =  mongoose.model('Blurb');
	var blurb = new media();
	var temp = blurb._id;
	blurb.title = req.body.title || '';
	blurb.quote = req.body.quote || '';
	blurb.owner = recFor;
	blurb.ref = recBy;
	blurb.save(function(err, doc){
		if (!err)
		{
			appendDoc(recFor, temp, 'blurbi');
			appendDoc(recBy, temp, 'blurbo');
			next();
		}
	})
}

app.post('/picload', function(req, res){
	var form = new formidable.IncomingForm();
	form.uploadDir = 'public/images';
	form.keepExtensions = true;
	form.parse(req, function(err, fields, files){
		res.writeHead(200, {'content-type': 'text/plain'});
		var place = files.my_file.path.slice(files.my_file.path.indexOf("/"));
		picload(req.session._id, place);
		console.log(place);
		      res.write('received upload:\n\n');
		      res.end(sys.inspect({fields: fields, files: files}));
	})
})
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
app.post('/profile/:person', getSesh, newBlurb, function(req, res){
	res.redirect('/profile/'+req.params.person)
})
app.get('/profile/:person', getSesh, function(req, res){
	var person = mongoose.model('Person');
	console.log(req.params.person)
	person.findById(req.params.person, function (err, individual){
		if (err){console.log(err)}
		res.render('front', {locals:{session: true, title: 'sociaGraph', person:individual.facts, stuff:individual.dossier}})
		//console.log(individual.dossier.projects)
	});
})
app.get('/edit-blurbs', getSesh, getBlurbs, function(req, res){
	console.log(req.blurbs);
  	res.render('edit', {locals:
    	{
			session: true,
			title: 'Admin',
			person: req.person,
			stuff:req.person.dossier,
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
})
app.get('/edit-me', getSesh, function(req, res){
	console.log(req.person);
  	res.render('index', {locals:
    	{
			session: true,
			title: 'Admin',
			person: req.person,
			content: _.keys(user.models('Person').tree.facts),
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
	user.user(req.body.email, req.body.password, req);
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
    redirect_uri: 'http://mostmodernist.no.de:3000/fb/auth',
    scope: 'offline_access,user_location,friends_likes,friends_events,user_photos,publish_stream'
  }));
});

app.get('/fb/auth', function (req, res) {
  fb.getAccessToken('230413970320943', 'appSecret', req.param('code'), 'http://mostmodernist.no.de:3000/fb/auth', function (error, access_token, refresh_token) {
    fb.apiCall('GET', '/me', {access_token: access_token, fields:'id,gender,name,location,locale,friends'}, function (err, response, body){
	console.log(body);	
	})
  });
});

app.post('/fb/message', function (req, res) {
  fb.apiCall('GET', '/me',
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