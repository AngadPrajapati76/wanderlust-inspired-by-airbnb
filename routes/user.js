const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

const userController = require("../controllers/users.js");

// Signup
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signUp));

// Login
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true
    }),
    userController.logIn
  );

// View Profile
router.get(
  "/profile",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select("username email");

    if (!user) {
      req.flash("error", "User account not found.");
      return res.redirect("/logout");
    }

    res.render("users/profile.ejs", { user });
  })
);

// Update Profile
router.post(
  "/profile",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    // Validate required fields
    if (!username || !email) {
      req.flash("error", "Username and email are required.");
      return res.redirect("/profile");
    }

    // Validate username length
    if (username.length < 3 || username.length > 30) {
      req.flash("error", "Username must be between 3 and 30 characters.");
      return res.redirect("/profile");
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      req.flash("error", "Please enter a valid email address.");
      return res.redirect("/profile");
    }

    // Find logged-in user
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      req.flash("error", "User account not found.");
      return res.redirect("/logout");
    }

    // Check duplicate username
    const existingUsername = await User.findOne({
      username,
      _id: { $ne: currentUser._id }
    });

    if (existingUsername) {
      req.flash("error", "That username is already taken.");
      return res.redirect("/profile");
    }

    // Check duplicate email
    const existingEmail = await User.findOne({
      email,
      _id: { $ne: currentUser._id }
    });

    if (existingEmail) {
      req.flash("error", "That email address is already registered.");
      return res.redirect("/profile");
    }

    // Update profile
    currentUser.username = username;
    currentUser.email = email;

    await currentUser.save();

    // Refresh Passport session after username change
    req.login(currentUser, (err) => {
      if (err) {
        return next(err);
      }

      req.flash(
        "success",
        "Your profile has been updated successfully."
      );

      return res.redirect("/profile");
    });
  })
);

// Logout
router.get("/logout", userController.logOut);

module.exports = router;