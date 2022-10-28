//
require('dotenv').config() // Environment variables from a .env file
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
//const md5 = require("md5") // md5, hashing function

// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express()
// console.log(process.env.API_KEY)

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// Set the view engine to ejs
app.set('view engine', 'ejs');

// Port 3000
const port = 3000;



// Connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true })

// UserSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})



// Model User
const User = mongoose.model("User", userSchema)

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

// Get value from Register Form by POST method
app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash
        })
        // Save value from input value to mongodb
        newUser.save(function (err) {
            if (err) {
                res.send(err)
                console.log(err)
            } else {
                res.render("secrets")
            }
        })
    });
});

// Login Route
app.post("/login", (req, res) => {
    const userName = req.body.username
    const password = req.body.password

    // Checking User name 
    User.findOne({ email: userName }, function (err, foundUser) {
        if (err) {
            console.log(err)
            res.send("Cannot find this user")
        } else {
            if (foundUser) {
                // using Bcrypt to compare password
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.render("secrets")
                    } else {
                        res.send("Password or Email is not Correct")
                        console.log("Password or Email is not Correct")
                    }
                });

                // if (foundUser.password === password) {
                //     res.render("secrets")
                // } else {
                //     res.send("Password or Email is not Correct")
                //     console.log("Password or Email is not Correct")
                // }
            }
        }
    })

});








app.listen(port, () => {
    console.log("Server is running on port 3000")
})