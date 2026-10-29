
const express = require("express");
const router = express.Router();

const Wishlist = require("../models/wishlist.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");

// Show the user's wishlist
router.get(
    "/wishlist",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const wishlist = await Wishlist.find({
            user: req.user._id
        })
            .populate("listing")
            .sort({ createdAt: -1 });

        // Ignore properties that have been deleted.
        const validWishlist = wishlist.filter(
            item => item.listing
        );

        res.render("wishlist/index.ejs", {
            wishlist: validWishlist
        });
    })
);

// Return saved listing IDs to display filled hearts.
router.get(
    "/wishlist/ids",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const items = await Wishlist.find({
            user: req.user._id
        }).select("listing");

        res.json({
            ids: items.map(item => item.listing.toString())
        });
    })
);

// Add or remove a property from the wishlist.
router.post(
    "/wishlist/:listingId/toggle",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { listingId } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(listingId)) {
            return res.status(400).json({
                message: "Invalid property ID."
            });
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({
                message: "Property not found."
            });
        }

        const existing = await Wishlist.findOne({
            user: req.user._id,
            listing: listingId
        });

        if (existing) {
            await Wishlist.deleteOne({
                _id: existing._id
            });

            return res.json({
                saved: false,
                message: "Removed from wishlist."
            });
        }

        try {
            await Wishlist.create({
                user: req.user._id,
                listing: listingId
            });
        } catch (error) {
            // Handle a duplicate request safely.
            if (error.code === 11000) {
                return res.json({
                    saved: true,
                    message: "Already in your wishlist."
                });
            }

            throw error;
        }

        return res.json({
            saved: true,
            message: "Added to wishlist."
        });
    })
);

module.exports = router;
