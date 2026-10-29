const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    }
});

// Prevent duplicate email addresses in MongoDB
userSchema.index(
    { email: 1 },
    { unique: true }
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);