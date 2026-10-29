
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    checkIn: {
        type: Date,
        required: true
    },

    checkOut: {
        type: Date,
        required: true
    },

    totalPrice: {
        type: Number,
        required: true,
        min: 1
    },

    // Booking lifecycle
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    },

    // Payment lifecycle
    paymentStatus: {
        type: String,
        enum: ["created", "paid", "failed"],
        default: "created"
    },

    // Razorpay payment references
    razorpayOrderId: {
        type: String,
        default: null
    },

    razorpayPaymentId: {
        type: String,
        default: null
    },

    razorpaySignature: {
        type: String,
        default: null
    },

    paidAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

bookingSchema.index({
    listing: 1,
    status: 1,
    checkIn: 1,
    checkOut: 1
});

bookingSchema.index(
    { razorpayOrderId: 1 },
    { unique: true, sparse: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
