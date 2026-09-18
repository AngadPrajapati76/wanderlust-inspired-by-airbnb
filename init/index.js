const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const url = "mongodb://127.0.0.1:27017/wanderlust";

main()
.then((res) =>{
    console.log("Connection Successful");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(url);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: '6aa402ef5670220118c058a5'}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialised");
}

initDB();