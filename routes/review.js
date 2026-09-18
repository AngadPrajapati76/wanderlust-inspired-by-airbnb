const express = require("express");
const router = express.Router({mergeParams: true});
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError");
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

//Post Route
router.post("/",isLoggedIn, validateReview, wrapAsync(reviewController.writeNewReview));

//review route 
router.delete("/:reviewId",isLoggedIn,isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;