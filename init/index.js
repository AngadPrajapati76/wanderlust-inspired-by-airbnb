const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
require("dotenv").config();

const url = process.env.ATLASDB_URL;
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});

async function main() {
    await mongoose.connect(url);
    console.log("Connection Successful");
}

const initDB = async () => {
    await Listing.deleteMany({});

    const listings = [];

    for (const obj of initData.data) {
        const response = await geocodingClient.forwardGeocode({
            query: `${obj.location}, ${obj.country}`,
            limit: 1
        }).send();

        if (!response.body.features.length) {
            console.log(`Location not found: ${obj.location}, ${obj.country}`);
            continue;
        }

        const listing = {
            ...obj,
            owner: "6ab574e162ae0e9b72976df1",
            geometry: response.body.features[0].geometry
        };

        listings.push(listing);
    }

    await Listing.insertMany(listings);

    console.log(`${listings.length} listings were initialised`);
};

async function start() {
    try {
        await main();
        await initDB();
        await mongoose.connection.close();
        console.log("Database connection closed");
    } catch (err) {
        console.log(err);
    }
}

start();