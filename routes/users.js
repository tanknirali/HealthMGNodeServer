var express = require('express');
var nodemailer = require('nodemailer');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var Patient = require('../models/patient');
var MongoClient = require('mongodb').MongoClient;
var data = "xyz";
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');
var currentUser = "";
var fname = "";
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//required for passport session
router.use(session({
secret: 'secrettexthere',
saveUninitialized: true,
resave: true
}));

//Init passport authentication 
router.use(passport.initialize());
//persistent login sessions 
router.use(passport.session());


/* Register */
router.get('/register', function(req, res) {
  res.render('register');
});

/* Login */
router.get('/login', function(req, res) {
  res.render('login');
});


router.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
	  
	  next();
});

/* Render Dashboard */
router.get('/dashboard', function(req, res) {
	if(req.isAuthenticated()){
		res.render('dashboard');
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
	
});

/* Render Give Permission Page */
router.get('/permission', function(req, res) {
	//console.log(currentUser);
	//if(req.isAuthenticated()){
		Patient.find({permissionBy: currentUser}, function(err, Patients){
			if(err) {
				res.json(err);
			}else {
				res.send({
					Patients: Patients
					});
				//console.log({Patients: JSON.stringify(Patients)});
				
			}
		});
});

/* Render View Other's Data Page */
router.get('/others-data', function(req, res) {
		Patient.find({permissionTo: currentUser}, function(err, Patients){
			if(err) {
				res.json(err);
			}else {
				res.send({
					Patients: Patients
					});
				//console.log({Patients: Patients});
			}
		});
});


/* Add/Give Permission */
router.post('/patient', function(req, res) {
	var result = null;
	new Patient({
		permissionTo: req.body.permissionTo,
		permissionBy: req.body.permissionBy,
		steps: req.body.steps,
		heartrate: req.body.heartrate,
		distance: req.body.distance,
		calories: req.body.calories
	}).save(function(err, doc){
		if(err){
			res.json(err);
		}else {
			result = doc;
			console.log(result);
			console.log(result.permissionBy);
			emailadd = result.permissionTo;
			currentemailadd = result.permissionBy;
			var transporter = nodemailer.createTransport({
		        service: 'Gmail',
		        auth: {
		            user: 'health.mg2016@gmail.com', // Your email id
		            pass: 'Nirali123' // Your password
		        }
		    });
			var text = 'Hello, You are given permission to monitor health data of ' + currentemailadd +'  \n\n' ;
			var mailOptions = {
				    from: currentemailadd, // sender address
				    to: emailadd, // list of receivers
				    subject: 'HealthMG Permission Granted', // Subject line
				    text: text //, // plaintext body
				   
				};
			transporter.sendMail(mailOptions, function(error, info){
			    if(error){
			        console.log(error);
			        
			    }else{
			        console.log('Message sent: ' + info.response);
			        
			    };
			});
			
		}
		res.send(doc);
		//console.log(doc);
	}); 
	
});

/* Revoke Permission */
router.post('/revoke', function(req, res) {
	var result = null;
		Patient.findOneAndRemove({
			permissionTo: req.body.permissionTo, 
			permissionBy: req.body.permissionBy
		}, function(err){
				if(err){
					res.json(err);
				}else {
					result = true;
					//res.redirect('/users/permission');
					//console.log(doc);
					console.log('successfully deleted data');
				}
				res.send(result);
		}); 
		
});




/*
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}
*/

/* Register User */
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	regresult = true;
	/* validations 
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	
	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {*/
	if (email !== undefined && email != ""){
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password
		});

		User.createUser(newUser, function(err, user){
			regresult = false;			
			if(err) throw err;
			console.log("Error with registration");
		});
	
		//req.flash('success_msg', 'You are registered and can now login');
		if (regresult){
		res.send(email);
		}
		
	}	
	
		res.send(false);
	
});

passport.use(new LocalStrategy(
		function(username, password, done) {
			User.getUserByUsername(username, function(err, user){
				if(err) throw err;
			if(!user){
				return done(null, false, {message: 'Unknown User'});
			}

			User.comparePassword(password, user.password, function(err, isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				} else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', {successRedirect:'/users/dashboard', failureRedirect:'/users/login',failureFlash: true}),
	function(req, res) {
    	res.redirect('/users/dashboard');
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

router.get('/MobisLoggedin', function(req, res){
	res.setHeader('Content-Type', 'application/jsonp');
	abcd = false;
	if (req.isAuthenticated()){
		abcd = true;
	}
	console.log(abcd);
	res.jsonp(JSON.stringify(abcd));
});

database = null;
MongoClient.connect('mongodb://anu:anu@ds023108.mlab.com:23108/charts', function(err, db) {
	  if (err) {
	    throw err;
	  }
	  database = db;
});

database2 = null;
MongoClient.connect('mongodb://nithin:nithin@ds031618.mlab.com:31618/health_mg', function(err, db) {
	  if (err) {
	    throw err;
	  }
	  database2 = db;
});

router.post('/getUserID', function(req, res) {
	email = req.body.email;	
	console.log(email);
	database2.collection('users').find({email:email}).sort({_id:-1}).toArray(function(err, result) { 
	    if (err) {
	      throw err;
	    }
	    data = result;
	    //console.log(data[0]);
	    res.send(data[0]);
	  });
	
});


//router.post('/getUserEmail', function(req, res) {
//	id = req.body.id;	
//	database.collection('users').find({_id:id}).sort({_id:-1}).toArray(function(err, result) { 
//	    if (err) {
//	      throw err;
//	    }
//	    data = result;
//	    console.log(data[0]);
//	    res.send(data[0]['email']);
//	  });
//	
//});



router.post('/Moblogin',
		passport.authenticate('local', {successFlash:'welcome', failureFlash:'Try again',failureFlash: true}),
		function(req, res) {
			var result = "";
			if (req.isAuthenticated()){
				result = req.user.email;
				fname = req.user.name;
				currentUser = req.user.email;
			}else{
				
			}
			res.send(result);
	    	//res.send({email: result , fname: fname});
	    	//console.log(result);
	
});

router.get('/user-fullname', function(req, res) {
	User.findOne({name:fname}, function(err, User){
		if(err) {
			res.json(err);
		}else {
			res.send({
				User: JSON.stringify(User)
				});
			console.log({User: User});
			console.log({User: JSON.stringify(User)});
		}
	});
});

router.post('/getAllCal', function(req, res) {
	userkey = req.body.userkey;
	console.log(userkey)
	database2.collection('calories').find({user:userkey}).sort({_id:-1}).limit(400).toArray(function(err, result) { //Pick all data in the db
	    if (err) {
	      throw err;
	    }
	    data = result;
	    console.log(data[0]);
	    res.send(data);
	  });
	
});

router.post('/getAllHeart', function(req, res) {
	userkey = req.body.userkey;	
	database2.collection('heartrates').find({user:userkey}).limit(400).sort({_id:-1}).toArray(function(err, result) { //Pick all data in the db
	    if (err) {
	      throw err;
	    }
	    data = result;
	    res.send(data);
	  });
	
});

router.post('/getAllSteps', function(req, res) {
	userkey = req.body.userkey;
	database2.collection('stepcounts').find({user:userkey}).limit(400).sort({_id:-1}).toArray(function(err, result) { //Pick all data in the db
	    if (err) {
	      throw err;
	    }
	    data = result;
	    res.send(data);
	  });
	
});

router.post('/getAllDistance', function(req, res) {
	userkey = req.body.userkey;	
	database2.collection('distances').find({user:userkey}).limit(400).sort({_id:-1}).toArray(function(err, result) { //Pick all data in the db
	    if (err) {
	      throw err;
	    }
	    data = result;
	    res.send(data);
	  });
	
});



module.exports = router;
