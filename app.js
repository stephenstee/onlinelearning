var express               = require("express");
var app                   = express();
var mongoose              = require("mongoose");
var bodyparser            = require("body-parser");
var passport              = require('passport');
var LocalStrategy         = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var methodOverride        = require('method-override')
var User                  = require("./models/user");


// console.log(process.env.DATABASEURL);
mongoose.connect(process.env.DATABASEURL,{useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.connect("mongodb+srv://angeetha:angeetha1014@cluster0-da2vw.mongodb.net/angeetha?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true});



app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(require("express-session")({
	secret: "i am the legend",
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


var courseSchema = new mongoose.Schema({
	title: String,
	image: String,
	description: String,
	material: String,
	materialdesc: String,
	materiallink: String,
	exercise: String,
	exercisedesc: String,
	exerciselink: String,
	test: String,
	testdesc: String,
	testlink: String
	
})
var Course = mongoose.model("Course", courseSchema);

var studentSchema = new mongoose.Schema({
	name: String,
	dob: String,
	address: String,
	phone: String,
	designation: String,
	favlang: String,
	author:{
		id:{ 
			type: mongoose.Schema.Types.ObjectId,
		    ref: "User"
		   },
		username: String
	}
})

var Student = mongoose.model("Student", studentSchema);

//////////////////////////////////////////////////////////////////////////////////////////
app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	next();
})

///////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////
// user side

app.get("/",function(req,res){
   res.render("welcome");
})

app.get("/home",isLoggedIn,function(req,res){
	Course.find({},function(err,course){
	   if(err){
		   console.log("error");
	   }else{
		   res.render("home",{course:course});
	   }
   })
})

app.get("/home/new",function(req,res){
	res.render("new");
})
app.post("/home",function(req,res){
	Course.create(req.body.course,function(err,newcourse){
		if(err){
			res.redirect("/");
		}
		else{
			res.redirect("/home");
		}
	})
})

app.get("/admin",function(req,res){
	res.render("admin");
})
app.post("/admin",function(req,res){
	var user = "angeetha";
	var pass = "123";
	var username = req.body.username;
	var password = req.body.password;
	if(user === username && pass === password){
		res.render("option");
	}else{
		res.redirect("/");
	}
})

app.get("/home/admin",function(req,res){
	Course.find({},function(err,course){
		if(err){
			console.log("error");
		}else{
			res.render("admincourse", {course:course});
		}
	})
})

app.get("/home/:id",function(req,res){
	Course.findById(req.params.id, function(err, newcourse){
		if(err){
			res.redirect("/home");
		}else{
			res.render("show",{course: newcourse});
		}
	})
})

app.get("/home/:id/edit",function(req,res){
	Course.findById(req.params.id,function(err,course){
		if(err){
			console.log("error");
		}else{
			res.render("edit", {course:course});
		}
	})
})

app.put("/home/:id",function(req,res){
	Course.findByIdAndUpdate(req.params.id, req.body.course,function(err, updatecourse){
		if(err){
			res.redirect("/home");
		}else{
			res.redirect("/home/" + req.params.id);
		}
	})
})

app.delete("/home/:id",function(req,res){
	Course.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/home/admin");
		}else{
			res.redirect("/home");
		}
	})
})
/////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////
// student form and student details

app.get("/student",isLoggedIn,function(req,res){
	Student.find({},function(err,student){
		if(err){
			res.redirect("/home")
		}else{
			res.render("studentinfo",{student:student});
		}
	})
})
/////////////////////////////////////////////////////////////////////
// admin studentinfo page
app.get("/student/admin",function(req,res){
	Student.find({},function(err,student){
		if(err){
			console.log(err);
		}else{
			res.render("adminstudent",{student:student})
		}
	
	})
})
///////////////////////////////////////////////////////////////////		
app.get("/student/new",isLoggedIn,function(req,res){
	res.render("studentform");
})

app.post("/student",isLoggedIn,function(req,res){
	var name = req.body.name;
	var dob = req.body.dob;
	var address = req.body.address;
	var phone = req.body.phone;
	var designation = req.body.designation;
	var favlang = req.body.favlang;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newstudent = {
		name:name,
		dob:dob,
		address:address,
		phone:phone,
		designation:designation,
		favlang:favlang,
		author:author
	}
	Student.create(newstudent ,function(err,student){
		if(err){
			res.redirect("/student")
		}else{
			console.log("this is student details " + student);
			res.redirect("/home");
		}
	})
})

app.get("/student/:id",CheckOwner,function(req,res){
	Student.findById(req.params.id,function(err, student){
		if(err){
			res.redirect("/student");
		}else{
			res.render("studentshow",{student:student});
		}
	})
})

app.get("/student/:id/edit",function(req,res){
	Student.findById(req.params.id,function(err, student){
		if(err){
			res.redirect("/home");
		}else{
			res.render("studentedit", {student:student});
		}
	})
})

app.put("/student/:id",function(req,res){
	Student.findByIdAndUpdate(req.params.id,req.body.student,function(err, student){
		if(err){
			res.redirect("/home");
		}else{
			res.redirect("/student/" + req.params.id);
		}
	})
})
/////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////////
// Authentication

app.get("/register",function(req,res){
	res.render("register");
})

app.post("/register",function(req,res){
	User.register(new User({username: req.body.username}), req.body.password, function(err,user){
		if(err){
			console.log("error");
			return res.render("register");
		}else{
		passport.authenticate("local")(req,res, function(){
			
			res.redirect("/student/new");
	})
		}
})
})

app.get("/login",function(req,res){

	res.render("login");
})

app.post("/login",passport.authenticate("local",{
	successRedirect: "/home",
	failureRedirect: "/login"
	
}),function(req,res){	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
})

function isLoggedIn(req,res, next){
	if(req.isAuthenticated()){
			// console.log(req.user);
		return next();
	}
	res.redirect("/login");
}
function CheckOwner(req,res,next){
	if(req.isAuthenticated()){
		Student.findById(req.params.id,function(err,student){
			if(err){
				console.log(err);
			}else{
				if(student.author.id.equals(req.user._id)){
					next();
			   }
			else
			{
			res.redirect("back");	
			}
			}
		})
	}else{
		res.redirect("back");
	}
}



app.listen(process.env.PORT || 3000, process.env.IP,function(){
	console.log("server starts");
})