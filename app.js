require("dotenv").config();

const express = require("express");
const app = express();
const mongoose  = require("mongoose");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const { wrap } = require("module");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const user = require("./models/user.js");


const dbUrl = process.env.ATLASDB_URL;

main().then((res) =>{
    console.log("Connection Successful");
}) .catch((err) => {
    console.log(err);
});

async function main(params) {
    await mongoose.connect(dbUrl);
}
app.engine("ejs",ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async(req,res) => {
//     let fakeUser = new User({
//         email: "abc12@gmail.com",
//         username: "abcd",
//     });
//     let registeredUSer =  await User.register(fakeUser, "password");
//     res.send(registeredUSer);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("/{*splat}", (req,res,next) => {
    next(new ExpressError(404, "Page not found!"));
});

//async error handling
app.use((err,req,res,next) => {
    let { status=500, message="Something Went Wrong!" } = err;
    res.status(status).render("error.ejs", {message});
    // res.status(status).send(message);
    // res.send("Something went wrong!");
});

app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});