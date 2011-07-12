var crypto = require('crypto'),
	hashed_password,
	salt,
	_password
	,mongoose = require('mongoose');	
	
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
		facts: {
			email: String,
			fname: String,
			mname: String,
			lname: String,
			gender: String,
			age: Number,
			location: String,
			articles: [Article],
			bio: String,
			portrait: String,
			comments: [Article]
		},
		secrets: {
			fb_id: String,
			access_token: String,
			salt: String,
			password: String,
			connections: {fb: Array, tw: Array, Lk: Array},
			is_verified: Boolean,
			is_admin: Boolean
		},
		resume:{
			blurbi: Array,
			blurbo: Array,
			projects: [Article]
		}
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
	
	exports.models = function (which){
	//	console.log(eval(which));
		return eval(which)
	}
//	exports.Article = function(){var art = mongoose.model('Article');console.log(art);return new art();}
	
exports.user = function (email, password, req){
	
			authenticate = function(plaintext){
				return encryptPassword(plaintext) === hashed_password;
			},
			
			makeSalt = function(){
				return Math.round((new Date().valueOf() * Math.random())) + '';
			},
			
			encryptPassword = function(password){
				return crypto.createHmac('sha1', salt).update(password).digest('hex');
			},

			doit = function(password){
				_password = password;
				salt = makeSalt();
				hashed_password = encryptPassword(password)
			},
			
			mak = function(){
				doit(password);
				var person = mongoose.model('Person');
				newUser = new person;
				newUser.facts.email = email;
				newUser.secrets.password = hashed_password;
				newUser.secrets.salt = salt;
				newUser.secrets.is_admin = true;
				newUser.secrets.is_verified = false;
				newUser.save(function (err, person){
					if (!err) newUser = person; console.log('new perseon += \n'+ person.email +'\n'+newUser._id +'\n'+person.password);
				})
				req.session_id = newUser._id;
				return newUser
				//newU.hmset(id, 'email', email, 'password', hashed_password,'salt', salt, 'isAdmin', 1, 'id', id);
			},
 mak();
};