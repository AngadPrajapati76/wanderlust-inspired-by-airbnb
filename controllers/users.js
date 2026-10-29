
const User = require("../models/user.js");
const { sendWelcomeEmail } = require("../utils/email.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};


module.exports.signUp = async (req, res, next) => {
    try {
        const username =
            typeof req.body.username === "string"
                ? req.body.username.trim()
                : "";

        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password = req.body.password;

        // Validate signup fields
        if (!username || !email || !password) {
            req.flash("error", "All fields are required.");
            return res.redirect("/signup");
        }

        // Debug only the submitted field values, never the password
        console.log("Signup username:", username);
        console.log("Signup email:", email);

        const newUser = new User({ email, username });

        const registeredUser = await User.register(
            newUser,
            password
        );

        // Send welcome email without blocking signup
        sendWelcomeEmail(registeredUser).catch(error => {
            console.error("Welcome email failed:", error.message);
        });

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }

            req.flash("success", "Welcome to wanderlust!");
            return res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        return res.redirect("/signup");
    }
};


module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.logIn = async (req, res) => {
    req.flash("success", "Welcome back to wanderlust!");
    let redirectUrl = res.locals.redirectURL || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logOut = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You are logged out");
        res.redirect("/listings");
    });
};
