
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError.js");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");
const wishlistRouter = require("./routes/wishlist.js");

// Environment variables
const dbUrl = process.env.ATLASDB_URL;
const sessionSecret = process.env.SECRET;
const PORT = process.env.PORT || 8080;

// Validate required environment variables
if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing from environment variables");
}

if (!sessionSecret) {
    throw new Error("SECRET is missing from environment variables");
}

// Database connection
async function main() {
    await mongoose.connect(dbUrl);
    console.log("MongoDB connected successfully");
}

main().catch((err) => {
    console.error("MongoDB connection failed:", err);
});

// EJS configuration
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: sessionSecret,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.error("MongoDB session store error:", err);
});

// Session configuration
const sessionOptions = {
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        // Enable this when deploying behind HTTPS, as on Render.
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Shared template variables
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Homepage: redirect to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Application routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", bookingRouter);
app.use("/", wishlistRouter);

// 404 handler
app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

// Centralized error handler (must remain last)
app.use((err, req, res, next) => {
    console.error(err);

    const status = err.status || err.statusCode || 500;
    const message =
        status === 500 && process.env.NODE_ENV === "production"
            ? "Something went wrong! Please try again later."
            : err.message || "Something went wrong!";

    if (res.headersSent) {
        return next(err);
    }

    res.status(status).render("error.ejs", { message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
