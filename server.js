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
	, sys = require('sys')
  , step = require('step')
  , async = require('async');

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
		res.redirect('/fb');
	if(req.session._id)
	{
		req.perp = mongoose.model('Person');
		req.perp.findById(req.session._id, function (err, individual){
			if (err){console.log(err);}
			req.session.regenerate(function(err){
				//console.log(individual);
				req.session._id = individual._id;
				req.facts = individual.doc.facts;
				req.person = individual;
				next();
			});
		});}
}

function getUser(req, res, next){
	var person = mongoose.model('Person'), dude;
	person.findById(req.session._id, function (err, individual){
		if (err){console.log(err);}
		dude = individual;
		console.log(dude);
	});
}

function upDoc(id, field, key, valu){
	// keys is an obj
	var article = mongoose.model('Person');
	article.findById(id, function (err, doc){
		if (err){console.log(err);}
		doc[field][key] = valu;
		doc.save(function (err, res){
			console.log(err);
			console.log(res);	
		});
	});
}
/*
function getBlurbs(req, res, next){
	req.blurbs = [];
	var blurbi = mongoose.model('Blurb');
	var y = req.person.dossier.blurbi.length;
	for (x = 0; x < req.person.dossier.blurbi.length; x++)
		if (x === req.person.dossier.blurbi.length){next();}
		blurbi.findById(a, function (err, doc){
			if(!err){
				req.blurbs.push(doc);
			}
		});
}
*/
function picload(id, valu){
	// keys is an obj
	var article = mongoose.model('Person');
	article.update({_id: id}, {'facts.portrait':valu}, function (err, rez){
		if (err){console.log(err);}
    console.log(rez);
	});
}


function newMedia (doc_type, info){
	var media = mongoose.model('Media');
	var doc = new Media();
	doc.doc_type = doc_type;
	doc.meta = info.uploads.meta; //an object
}

function newDoc (req, res, next){
	var media = mongoose.model('Article');
	var doc = new media();
	user.save2user(req.session._id, doc._id);
	doc.save(function(err, doc){
		if(err){console.log(err);}
		if(doc)
		{
			req.doc = doc;
			next();
		}
	});
}
function newPerson (req, res, next){
	var media = mongoose.model('Person');
	var doc = new media();
	doc.save(function(err, doc){
		if(err){console.log(err);}
		if(doc)
		{
			req.doc = doc;
			console.log(doc._id);
			req.facts = doc;
			next();
		}
	});
}
function appendDoc(_id, string, key){
	var nerd = mongoose.model('Person');
	nerd.findById(_id, function (err, doc){
		if(!err)
		{	
		doc.dossier[key].push(string);
		console.log(doc.dossier[key]);
		doc.save();
		}
	});
}
function newBlurb (req, res, next){
	var recBy = req.session._id
	,	recFor = req.params.person;
	var media =  mongoose.model('Blurb');
	var blurb = new media();
	var temp = blurb._id;
	blurb.title = req.body.title || '';
	blurb.quote = req.body.quote || '';
	blurb.owner._id = recFor;
	blurb.ref = recBy;
	blurb.save(function(err, doc){
		if (!err)
		{
			appendDoc(recFor, temp, 'blurbi');
			appendDoc(recBy, temp, 'blurbo');
			next();
		}
	});
}

function getBlurbs(id){
  var ibid =[]; 
  step(
    function(){
      var blurb = mongoose.model('Blurb');
      blurb.find({ref: id}, this);
    },
    function(err, doc){
      //console.log(doc);
      ibid = doc;
    }
    );
  console.log(ibid);
}
function sortBlurb(perp, sort){
  var nerd = mongoose.model('Person');
  nerd.update({_id:perp}, {'dossier.blurbi': sort}, function(err,re){
    console.log(re);
    res.end();
  });
}

app.post('/publish-state', getSesh, function(req,res){
  var blurb = mongoose.model('Blurb');
  var bull = (req.body.published === 'true');
  console.log(bull+'\n'+req.body.id);
  blurb.update({_id:req.body.id}, {published:bull}, function(err,save){
    console.log(err || save); 
    res.end();
  });
});

app.post('/delete-blurb', getSesh, function(req,res){
  console.log(req.person.doc.dossier.blurbi+'\n'+req.body.id);
  var blurbs = [];
  blurbs = _.without(req.person.doc.dossier.blurbi, req.body.id);
  console.log(blurbs);
  var person = mongoose.model('Person');
  person.update({_id:req.session._id}, {'facts.fname': 'eagle','dossier.blurbi':blurbs}, function(err,save){console.log('is saved: '+save+'\n'+err);
    res.redirect('/stoop/'+req.session._id);
    res.end();
  });
  //var blurb = mongoose.model('Blurb');
  //blurb.remove({_id:req.body.id}, function(err,re){console.log(re)})
});
app.post('/sort-blurbs', getSesh, function(req,res){
    var nerd = mongoose.model('Person');
    console.log(req.query.data);
    res.end();
  nerd.update({_id:req.session._id}, {'dossier.blurbi': JSON.parse(req.query.data)}, function(err,re){
    console.log(re);
    res.end();
  });
});
app.post('/picload', function(req, res){
	var form = new formidable.IncomingForm();
	form.uploadDir = 'public/person/'+req.session._id;
	form.keepExtensions = true;
	form.parse(req, function(err, fields, files){
		res.writeHead(200, {'content-type': 'text/plain'});
		var place = files.my_file.path.slice(files.my_file.path.indexOf("/"));
		picload(req.session._id, place);
		console.log(place);
		      res.write('received upload:\n\n');
		      res.end(sys.inspect({fields: fields, files: files}));
	});
});
app.post('/update-profile', getSesh, function(req, res){
    var person = mongoose.model('Person');
    person.update({_id: req.session._id}, {'facts.title': req.body.title, 'facts.fname': req.body.fname, 'facts.mname': req.body.mname, 'facts.lname': req.body.lname, 'facts.position': req.body.position, 'facts.website': req.body.website, 'facts.age': req.body.age, 'facts.contact': req.body.contact, 'facts.location': req.body.location, 'facts.bio': req.body.bio}, function(err, re){if (err){console.log(err);}console.log(re);res.redirect('/profile/edit-me');});
});

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
app.post('/profile/id/:person', getSesh, newBlurb, function(req, res){
	res.redirect('/profile/id/'+req.params.person);
});
function byOwner(b,cb){
  var person = mongoose.model('Person');
    person.findById(b.owner._id,function(err,perp){
      b.owner.facts = perp.facts;
      cb(null, b);
    });
}
function getBlurb(id, callback){
  var blurb = mongoose.model('Blurb');
  blurb.findById(id, function(err,doc){
    callback(null, doc);
  });
}
function stoop(blurbs, callback){
  console.log(blurbs.length);
  if (blurbs.length < 1)
  {
    callback(null,blurbs);  
  }
  if (blurbs.length > 0)
  {
  async.waterfall([
    function(cb){
      async.map(blurbs,getBlurb,function(err,res){
        cb(null,res);
      });
    },
    function(blurbs,cb){
      console.log(blurbs);
      async.map(blurbs,byOwner,function(err,res){
        cb(null,res);
      });
    },
    function(blurbs,cb){
      callback(null,blurbs);
    }
]);}}
app.get('/stoop/:person', getSesh, function(req,res){
  console.log(req.person.doc.dossier.blurbi);
  stoop(req.person.doc.dossier.blurbi, function(err, blurbs){ 
     res.render('front', {locals:{session: true, blurbs:blurbs, title: 'sociaGraph', person:req.person.doc, stuff:req.person.doc.dossier}});
  });
});

app.get('/profile/id/:person', function(req, res){
  var person = mongoose.model('Person'), blurb = mongoose.model('Blurb');
  console.log(req.params.person);
  person.findById(req.params.person, function(err,person){
    res.render('front', {locals:{session: true, blurbs: [], title: 'sociaGraph', person:person.facts, stuff:person.dossier}});
  });  
});
app.get('/profile/edit-blurbs', getSesh, getBlurbs, function(req, res){
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
});
app.get('/profile/edit-me', getSesh, function(req, res){
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
	req.session.destroy();
	res.redirect('/login');
});
app.post('/login', function(req, res){
	user.user(req.body.email, req.body.password, req);
	req.session._id = newUser._id;
	res.redirect('/logged');
});
app.get('/logged', getSesh, function(req, res){
	res.render('logged', {layout: false, locals: {
		title: 'OMEGAWD',
		sesh: req.session._id
	}});
});
app.get('/login', function (req, res){
	res.render('login', {layout: false, locals:{title: 'OMEGAWD'}});
});
app.get('/', function(req, res){
  res.render('front', {
    title: 'Welcome'
  });
});

app.get('/fb', function (req, res) {
  res.redirect(fb.getAuthorizeUrl({
    client_id: '230413970320943',
    redirect_uri: 'http://74.207.246.247:3001/fb/auth',
    scope: 'offline_access,user_location,friends_likes,friends_events,user_photos,publish_stream'
  }));
});

app.get('/fb/auth', function (req, res) {
  fb.getAccessToken('230413970320943', '8de03128b6dab8fa0fd18c560100594e', req.param('code'), 'http://74.207.246.247:3001/fb/auth', function (error, access_token, refresh_token) {
	fb.apiCall('GET', '/me', {access_token: access_token, fields:'id,gender,first_name, middle_name,last_name,location,locale,friends,website'}, function (err, response, body){
		console.log(body);
    var person = mongoose.model('Person');
		person.update({'secrets.fb_id':  body.id}, {'facts.fname': body.first_name, 'facts.mname':body.middle_name, 'facts.lname':body.last_name, 'facts.gender':body.gender, 'facts.website':body.website, 'secrets.fb_access_token': access_token,'secrets.fbx':body.friends.data}, {upsert:true, safe:true}, function (err, doc){
			if(!err)
      person.findOne({'secrets.fb_id':  body.id}, {secrets:1}, function(e, rez){
        fs.stat('public/person/'+rez.doc._id, function(err, stats){
          console.log(err);
          if (err){
          fs.mkdirSync('public/person/'+rez.doc._id, 644, function(err){console.log(err);}); //the user's image directory
          request.get('https://graph.facebook.com/'+rez.doc.secrets.fb_id+'/picture?type=large&access_token='+rez.doc.secrets.fb_access_token).pipe(fs.createWriteStream('public/person/'+rez.doc._id+'/profile.jpg'));
          person.update({_id: rez.doc._id}, {'facts.portrait': 'person/'+rez.doc._id+'/profile.jpg'}, function (err,res){console.log(err+'\n'+res);});
          }
        });
        req.session._id = rez._id;
        console.log(rez._id);
        res.redirect('/stoop/'+rez._id);
      });
		});	
	});
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
app.get('/set-pic', getSesh, function(req, res){
request.get('https://graph.facebook.com/'+req.person.doc.secrets.fb_id+'/picture?type=large&access_token='+req.person.doc.secrets.fb_access_token).pipe(fs.createWriteStream('public/person/prosfile.jpg'));
  //r.pipe(fs.createWriteStream('public/images/dude.gif'))
  //fs.createReadStream('public/images/google.html').pipe(r)
  fb.apiCall('GET', '/me/picture', {type: 'large', access_token: req.person.doc.secrets.fb_access_token}, function(error, response, body){
    console.log(body);  
    res.write('received pic list:\n\n');
  	res.end();
  });
});
app.get('fb/messages', function (req, res) {
  var stream = fb.apiCall('GET', '/me/feed', {access_token: req.param('access_token'), message: req.param('message')});
  stream.pipe(fs.createWriteStream('backup_feed.txt'));
});

app.listen(3001);
console.log("Express server listening on port %d", app.address().port);