//
require('dotenv').config() // Environment variables from a .env file
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")

// Oauth google 2.0
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Find or Create use mongoose
const findOrCreate = require('mongoose-findorcreate')

// Express-session
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')



const app = express()
// console.log(process.env.API_KEY)

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// Set the view engine to ejs
app.set('view engine', 'ejs');

// Session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}))
// Passport
app.use(passport.initialize())
app.use(passport.session())

// Port 3000
const port = 3000;



// Connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })

// UserSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})
// PassportLocalMongoose
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
// Model User
const User = mongoose.model("User", userSchema)

// use static authenticate method of model in LocalStrategy
const LocalStrategy = require('passport-local');
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


// Render Home page
app.get("/", (req, res) => {
    res.render('home')
})

// Render Login page
app.get("/login", (req, res) => {
    res.render('login')
})

// Render Register page
app.get("/register", (req, res) => {
    res.render('register')
});

// Secrets
app.get("/secrets", (req, res) => {
    // $ne => not equal
    User.find({ "secret": { $ne: null } }, function (err, foundUser) {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                res.render("secrets", { usersWithSecrets: foundUser })
            }
        }
    })
})

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log(err)
        }
        res.redirect('/');
    });
})

app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] })
)

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect Secrets.
        res.redirect('/secrets');
    });


// Get value from Register Form by POST method
app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });

});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret

    console.log(req.user.id)

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret
                foundUser.save(function () {
                    res.redirect("/secrets")
                })
            }
        }
    });

})

// Login Route
app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err)
            res.send("Wrong User or Password. Please check again! T-T")
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });

});








app.listen(port, () => {
    console.log("Server is running on port 3000")
})