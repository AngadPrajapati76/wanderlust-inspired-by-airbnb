
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

// Initialize Mapbox only when a token is available.
// This allows the app to start even if Mapbox configuration is missing,
// while geocoding operations will return a clear error.
const geocodingClient = mapToken
    ? mbxGeocoding({ accessToken: mapToken })
    : null;

// GET /listings
module.exports.index = async (req, res) => {
    const { location, category, minPrice, maxPrice } = req.query;

    const filter = {};

    // Search by title, location, or country
    if (location && location.trim() !== "") {
        const searchTerm = location.trim();

        filter.$or = [
            { title: { $regex: searchTerm, $options: "i" } },
            { location: { $regex: searchTerm, $options: "i" } },
            { country: { $regex: searchTerm, $options: "i" } },
        ];
    }

    // Category filter
    if (category && category.trim() !== "") {
        filter.category = category.trim();
    }

    // Validate and apply price filters
    const priceFilter = {};

    if (minPrice !== undefined && minPrice !== "") {
        const minimum = Number(minPrice);

        if (!Number.isFinite(minimum) || minimum < 0) {
            throw new ExpressError(400, "Please enter a valid minimum price.");
        }

        priceFilter.$gte = minimum;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
        const maximum = Number(maxPrice);

        if (!Number.isFinite(maximum) || maximum < 0) {
            throw new ExpressError(400, "Please enter a valid maximum price.");
        }

        priceFilter.$lte = maximum;
    }

    if (
        priceFilter.$gte !== undefined &&
        priceFilter.$lte !== undefined &&
        priceFilter.$gte > priceFilter.$lte
    ) {
        throw new ExpressError(
            400,
            "Minimum price cannot exceed maximum price."
        );
    }

    if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
    }

    const allListings = await Listing.find(filter).lean();

    res.render("listing/index.ejs", {
        allListings,
        query: req.query,
    });
};

// GET /listings/new
module.exports.renderNewForm = (req, res) => {
    res.render("listing/new.ejs");
};

// GET /listings/:id
module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    res.render("listing/show.ejs", { listing });
};

// POST /listings
module.exports.createListing = async (req, res) => {
    if (!geocodingClient) {
        throw new ExpressError(
            500,
            "Mapbox is not configured. Please check the MAP_TOKEN environment variable."
        );
    }

    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data for listing.");
    }

    if (!req.file) {
        throw new ExpressError(400, "Please upload a listing image.");
    }

    const { location } = req.body.listing;

    if (!location || !location.trim()) {
        throw new ExpressError(400, "Please enter a listing location.");
    }

    const response = await geocodingClient
        .forwardGeocode({
            query: location.trim(),
            limit: 1,
        })
        .send();

    const feature = response.body.features?.[0];

    if (!feature) {
        throw new ExpressError(
            400,
            "Could not find coordinates for this location. Please enter a more specific location."
        );
    }

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
    };
    newListing.geometry = feature.geometry;

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// GET /listings/:id/edit
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    const originalImageUrl = listing.image.url.replace(
        "/upload",
        "/upload/h_300,w_250"
    );

    res.render("listing/edit.ejs", {
        listing,
        originalImageUrl,
    });
};

// PUT /listings/:id
module.exports.updateListing = async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data for listing.");
    }

    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    Object.assign(listing, req.body.listing);

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// DELETE /listings/:id
module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
