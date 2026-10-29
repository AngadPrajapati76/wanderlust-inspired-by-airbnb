const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Notification = require("../models/notification.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendCancellationEmails
} = require("../utils/email.js");

if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
) {
    throw new Error("Razorpay API keys are missing from .env");
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Payment window: 15 minutes.
const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

// Validate booking dates.
function validateBookingDates(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        return "Please select both check-in and check-out dates.";
    }

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)
    ) {
        return "Please select valid dates.";
    }

    const startDate = new Date(`${checkIn}T00:00:00.000Z`);
    const endDate = new Date(`${checkOut}T00:00:00.000Z`);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        startDate.toISOString().slice(0, 10) !== checkIn ||
        endDate.toISOString().slice(0, 10) !== checkOut
    ) {
        return "Please select valid calendar dates.";
    }

    if (startDate < today) {
        return "Check-in cannot be in the past.";
    }

    if (endDate <= startDate) {
        return "Check-out must be after check-in.";
    }

    return null;
}

// Find overlapping confirmed bookings.
async function findBookingConflict(listingId, startDate, endDate) {
    return Booking.findOne({
        listing: listingId,
        status: "confirmed",
        checkIn: { $lt: endDate },
        checkOut: { $gt: startDate }
    });
}

// Expire pending unpaid bookings.
async function expirePendingBookings() {
    const now = new Date();

    await Booking.updateMany(
        {
            status: "pending",
            expiresAt: { $ne: null, $lte: now },
            paymentStatus: { $in: ["created", "failed"] }
        },
        {
            $set: {
                status: "cancelled",
                paymentStatus: "failed"
            }
        }
    );
}

// Delete old cancelled, unpaid bookings after 7 days
async function cleanupOldBookings() {
    try {
        const sevenDaysAgo = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        const result = await Booking.deleteMany({
            status: "cancelled",
            paymentStatus: { $ne: "paid" },
            updatedAt: { $lte: sevenDaysAgo }
        });

        if (result.deletedCount > 0) {
            console.log(
                `${result.deletedCount} old bookings deleted`
            );
        }
    } catch (error) {
        console.error("Booking cleanup failed:", error);
    }
}

// Run cleanup every hour
const cleanupTimer = setInterval(() => {
    cleanupOldBookings();
}, 60 * 60 * 1000);

cleanupTimer.unref();

// Run expiry cleanup once a minute.
const expiryTimer = setInterval(() => {
    expirePendingBookings().catch(error => {
        console.error("Pending booking expiry failed:", error);
    });
}, 60 * 1000);

if (typeof expiryTimer.unref === "function") {
    expiryTimer.unref();
}

// ======================================================
// 1. SHOW BOOKING CONFIRMATION PAGE
// ======================================================

router.get(
    "/listings/:id/booking",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const { checkIn, checkOut } = req.query;

        const dateError = validateBookingDates(checkIn, checkOut);

        if (dateError) {
            req.flash("error", dateError);
            return res.redirect(`/listings/${id}`);
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing does not exist!");
            return res.redirect("/listings");
        }

        if (listing.owner.equals(req.user._id)) {
            req.flash("error", "You cannot book your own property!");
            return res.redirect(`/listings/${id}`);
        }

        const startDate = new Date(`${checkIn}T00:00:00.000Z`);
        const endDate = new Date(`${checkOut}T00:00:00.000Z`);

        const existingBooking = await findBookingConflict(
            id,
            startDate,
            endDate
        );

        if (existingBooking) {
            req.flash("error", "These dates are already booked!");
            return res.redirect(`/listings/${id}`);
        }

        const numberOfNights =
            (endDate - startDate) / (1000 * 60 * 60 * 24);

        const totalPrice = numberOfNights * listing.price;

        res.render("booking/confirm.ejs", {
            listing,
            checkIn,
            checkOut,
            numberOfNights,
            totalPrice
        });
    })
);

// ======================================================
// 2. CREATE RAZORPAY ORDER OR RETRY PAYMENT
// ======================================================

router.post(
    "/listings/:id/booking/order",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        await expirePendingBookings();

        const { id } = req.params;
        const { checkIn, checkOut } = req.body;

        const dateError = validateBookingDates(checkIn, checkOut);

        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Listing does not exist."
            });
        }

        if (listing.owner.equals(req.user._id)) {
            return res.status(403).json({
                message: "You cannot book your own property."
            });
        }

        const startDate = new Date(`${checkIn}T00:00:00.000Z`);
        const endDate = new Date(`${checkOut}T00:00:00.000Z`);

        const existingConflict = await findBookingConflict(
            id,
            startDate,
            endDate
        );

        if (existingConflict) {
            return res.status(409).json({
                message: "These dates are already booked."
            });
        }

        const numberOfNights =
            (endDate - startDate) / (1000 * 60 * 60 * 24);

        const totalPrice = numberOfNights * listing.price;
        const amountInPaise = Math.round(totalPrice * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                message: "The booking amount is invalid."
            });
        }

        // Reuse an unexpired pending booking for the same user,
        // listing and dates.
        let booking = await Booking.findOne({
            listing: listing._id,
            user: req.user._id,
            checkIn: startDate,
            checkOut: endDate,
            status: "pending",
            paymentStatus: { $in: ["created", "failed"] },
            expiresAt: { $gt: new Date() }
        });

        if (!booking) {
            booking = new Booking({
                listing: listing._id,
                user: req.user._id,
                checkIn: startDate,
                checkOut: endDate,
                totalPrice,
                status: "pending",
                paymentStatus: "created",
                expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS)
            });
        } else {
            booking.totalPrice = totalPrice;
            booking.paymentStatus = "created";
            booking.expiresAt = new Date(
                Date.now() + PAYMENT_WINDOW_MS
            );
        }

        await booking.save();

        try {
            // A fresh Razorpay order is created for each retry.
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `booking-${booking._id}-${Date.now()}`,
                notes: {
                    bookingId: booking._id.toString(),
                    listingId: listing._id.toString()
                }
            });

            booking.razorpayOrderId = order.id;
            await booking.save();

            return res.json({
                key: process.env.RAZORPAY_KEY_ID,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                bookingId: booking._id.toString(),
                listingTitle: listing.title
            });
        } catch (error) {
            console.error("Razorpay order creation failed:", error);

            booking.paymentStatus = "failed";
            await booking.save();

            return res.status(502).json({
                message: "Unable to start payment. Please try again."
            });
        }
    })
);

// ======================================================
// 3. VERIFY PAYMENT AND CONFIRM BOOKING
// ======================================================

router.post(
    "/bookings/verify-payment",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !mongoose.isValidObjectId(bookingId)
        ) {
            return res.status(400).json({
                message: "Invalid payment verification details."
            });
        }

        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                message: "Payment order does not match this booking."
            });
        }

        // Make repeated successful verification requests safe.
        if (
            booking.status === "confirmed" &&
            booking.paymentStatus === "paid" &&
            booking.razorpayPaymentId === razorpay_payment_id
        ) {
            return res.json({
                message: "Payment was already verified.",
                redirectUrl: "/bookings"
            });
        }

        // Verify the signature before trusting the payment response.
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const receivedBuffer = Buffer.from(
            razorpay_signature,
            "hex"
        );

        const expectedBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );

        const signatureIsValid =
            receivedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            );

        if (!signatureIsValid) {
            return res.status(400).json({
                message: "Payment signature verification failed."
            });
        }

        // Do not confirm a cancelled or expired booking.
        if (
            booking.status !== "pending" ||
            booking.paymentStatus !== "created" ||
            !booking.expiresAt ||
            booking.expiresAt <= new Date()
        ) {
            if (
                booking.status === "pending" &&
                booking.expiresAt &&
                booking.expiresAt <= new Date()
            ) {
                booking.status = "cancelled";
                booking.paymentStatus = "failed";
                await booking.save();
            }

            return res.status(409).json({
                message:
                    "This booking has expired or is no longer awaiting payment. Please start a new booking. If your payment was captured, contact support for reconciliation."
            });
        }

        // Check availability again.
        const existingBooking = await findBookingConflict(
            booking.listing,
            booking.checkIn,
            booking.checkOut
        );

        if (existingBooking) {
            console.error(
                "Availability conflict after payment for booking:",
                booking._id.toString()
            );

            return res.status(409).json({
                message:
                    "Payment may have been received, but these dates are no longer available. Contact support for payment reconciliation or a refund."
            });
        }

        booking.razorpayPaymentId = razorpay_payment_id;
        booking.razorpaySignature = razorpay_signature;
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.paidAt = new Date();

        await booking.save();

        // Send email notifications after payment is verified.
        // Email failures must not affect the confirmed booking.
        try {
            const populatedBooking = await Booking.findById(booking._id)
                .populate("user")
                .populate({
                    path: "listing",
                    populate: {
                        path: "owner"
                    }
                });

            if (populatedBooking?.listing && populatedBooking?.user) {
                const listing = populatedBooking.listing;
                const guest = populatedBooking.user;
                const owner = listing.owner;

                await Promise.all([
                    sendBookingConfirmation({
                        booking: populatedBooking,
                        listing,
                        guest,
                        owner
                    }),
                    sendPaymentConfirmation({
                        booking: populatedBooking,
                        listing,
                        guest
                    })
                ]);
            }
        } catch (error) {
            console.error("Booking email notifications failed:", error);
        }

        // Notify the property owner after successful verification.
        const listing = await Listing.findById(booking.listing);

        if (listing) {
            try {
                await Notification.create({
                    recipient: listing.owner,
                    booking: booking._id,
                    message:
                        `New paid booking received for ${listing.title}.`
                });
            } catch (error) {
                console.error(
                    "Booking notification failed:",
                    error
                );
            }
        }

        return res.json({
            message: "Payment verified and booking confirmed.",
            redirectUrl: "/bookings"
        });
    })
);

// ======================================================
// 4. RECORD A FAILED PAYMENT ATTEMPT
// ======================================================

router.post(
    "/bookings/payment-failed",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { bookingId, orderId } = req.body;

        if (!mongoose.isValidObjectId(bookingId) || !orderId) {
            return res.status(400).json({
                message: "Invalid payment details."
            });
        }

        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user._id,
            razorpayOrderId: orderId,
            status: "pending"
        });

        if (!booking) {
            return res.status(404).json({
                message: "Matching pending booking not found."
            });
        }

        if (booking.expiresAt && booking.expiresAt <= new Date()) {
            booking.status = "cancelled";
            booking.paymentStatus = "failed";
        } else if (booking.paymentStatus !== "paid") {
            booking.paymentStatus = "failed";
        }

        await booking.save();

        return res.json({
            message: "Payment attempt recorded.",
            status: booking.status,
            paymentStatus: booking.paymentStatus
        });
    })
);

// ======================================================
// 5. USER BOOKINGS
// ======================================================

router.get(
    "/bookings",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        await expirePendingBookings();

        const bookings = await Booking.find({
            user: req.user._id
        })
            .populate("listing")
            .sort({ checkIn: -1 });

        res.render("booking/index.ejs", { bookings });
    })
);

// ======================================================
// 6. OWNER RESERVATIONS
// ======================================================

router.get(
    "/owner/reservations",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        await expirePendingBookings();

        const listings = await Listing.find({
            owner: req.user._id
        }).select("_id title image location price");

        const listingIds = listings.map(listing => listing._id);

        const bookings = await Booking.find({
            listing: { $in: listingIds }
        })
            .populate("listing")
            .populate("user", "username email")
            .sort({ checkIn: 1 });

        res.render("booking/owner.ejs", { bookings });
    })
);

// ======================================================
// 7. OWNER DASHBOARD
// ======================================================

router.get(
    "/owner/dashboard",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        await expirePendingBookings();

        const listings = await Listing.find({
            owner: req.user._id
        }).select("_id title");

        const listingIds = listings.map(listing => listing._id);

        const bookings = await Booking.find({
            listing: { $in: listingIds }
        })
            .populate("listing", "title")
            .populate("user", "username");

        const totalBookings = bookings.length;

        const confirmedBookings = bookings.filter(
            booking => booking.status === "confirmed"
        ).length;

        const cancelledBookings = bookings.filter(
            booking => booking.status === "cancelled"
        ).length;

        const totalEarnings = bookings
            .filter(
                booking =>
                    booking.status === "confirmed" &&
                    booking.paymentStatus === "paid"
            )
            .reduce(
                (total, booking) => total + booking.totalPrice,
                0
            );

        const totalProperties = listings.length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingBookings = bookings.filter(
            booking =>
                booking.status === "confirmed" &&
                new Date(booking.checkIn) >= today
        ).length;

        const pastBookings = bookings.filter(
            booking =>
                booking.status === "confirmed" &&
                new Date(booking.checkOut) <= today
        ).length;

        const propertyStats = listings.map(listing => {
            const propertyBookings = bookings.filter(
                booking => booking.listing.equals(listing._id)
            );

            return {
                listingId: listing._id,
                title: listing.title,
                totalBookings: propertyBookings.length,
                confirmedBookings: propertyBookings.filter(
                    booking => booking.status === "confirmed"
                ).length,
                cancelledBookings: propertyBookings.filter(
                    booking => booking.status === "cancelled"
                ).length
            };
        });

        res.render("booking/dashboard.ejs", {
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            totalEarnings,
            totalProperties,
            propertyStats,
            upcomingBookings,
            pastBookings,
            upcomingBookingDetails: bookings.filter(
                booking =>
                    booking.status === "confirmed" &&
                    new Date(booking.checkIn) >= today
            )
        });
    })
);

// ======================================================
// 8. NOTIFICATIONS
// ======================================================

router.get(
    "/notifications",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate({
                path: "booking",
                populate: {
                    path: "listing",
                    select: "title image location"
                }
            })
            .sort({ createdAt: -1 });

        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        res.render("booking/notifications.ejs", {
            notifications
        });
    })
);

// ======================================================
// 9. BOOKED DATES FOR A LISTING
// ======================================================

router.get(
    "/listings/:id/booked-dates",
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({
                error: "Listing does not exist"
            });
        }

        const bookings = await Booking.find({
            listing: id,
            status: "confirmed"
        }).select("checkIn checkOut");

        res.json({
            bookedDates: bookings.map(booking => ({
                checkIn: booking.checkIn,
                checkOut: booking.checkOut
            }))
        });
    })
);

// ======================================================
// 10. CANCEL A CONFIRMED BOOKING
// ======================================================


router.post(
    "/bookings/:bookingId/cancel",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { bookingId } = req.params;

        if (!mongoose.isValidObjectId(bookingId)) {
            req.flash("error", "Invalid booking ID.");
            return res.redirect("/bookings");
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }

        if (!booking.user.equals(req.user._id)) {
            req.flash(
                "error",
                "You are not authorized to cancel this booking."
            );
            return res.redirect("/bookings");
        }

        if (booking.status !== "confirmed") {
            req.flash(
                "error",
                "Only confirmed bookings can be cancelled."
            );
            return res.redirect("/bookings");
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                user: req.user._id,
                status: "confirmed"
            },
            {
                $set: { status: "cancelled" }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedBooking) {
            req.flash(
                "error",
                "This booking has already been cancelled or cannot be cancelled."
            );
            return res.redirect("/bookings");
        }

        const listing = await Listing.findById(booking.listing);

        // Existing in-app notification for the property owner
        if (listing) {
            try {
                await Notification.create({
                    recipient: listing.owner,
                    booking: updatedBooking._id,
                    message:
                        `A guest has cancelled their booking for ${listing.title}.`
                });
            } catch (error) {
                console.error(
                    "Cancellation notification failed:",
                    error
                );
            }
        }

        // NEW: Send cancellation emails to the guest and property owner
        try {
            const populatedBooking = await Booking.findById(
                updatedBooking._id
            )
                .populate("user")
                .populate({
                    path: "listing",
                    populate: {
                        path: "owner"
                    }
                });

            if (populatedBooking?.listing && populatedBooking?.user) {
                await sendCancellationEmails({
                    booking: populatedBooking,
                    listing: populatedBooking.listing,
                    guest: populatedBooking.user,
                    owner: populatedBooking.listing.owner
                });
            }
        } catch (error) {
            console.error(
                "Cancellation emails failed:",
                error
            );
        }

        req.flash(
            "success",
            "Your booking has been cancelled successfully."
        );

        res.redirect("/bookings");
    })
);


module.exports = router;
