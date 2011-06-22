function user (id, email, password){
			var crypto = require('crypto'),
				hashed_password,
				salt,
				_password;
	
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
				doit()
				var newUser = new User();
				newUser.email = email;
				newUser.password = hashed_password;
				newUSer.salt = salt;
				newUser.is_admin = true;
				newUser.is_verified = false;
				newUser.save(function (err, person){
					if (!err) console.log('new perseon += \n'+ person._id)
				})
				newU.hmset(id, 'email', email, 'password', hashed_password,'salt', salt, 'isAdmin', 1, 'id', id);
			},
 mak()
};

exports.user = user