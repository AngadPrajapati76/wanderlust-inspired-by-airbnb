
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
}

// Escape dynamic text before placing it in HTML.
function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function sendEmail({ to, subject, text, html }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Email skipped: EMAIL_USER or EMAIL_PASS is missing.");
        return false;
    }

    if (!to) {
        console.error("Email skipped: recipient email is missing.");
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"Wanderlust" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        // Email errors must never undo a booking or payment.
        console.error("Email sending failed:", error.message);
        return false;
    }
}

async function sendWelcomeEmail(user) {
    const username = escapeHtml(user.username || "Traveller");

    return sendEmail({
        to: user.email,
        subject: "Welcome to Wanderlust!",
        text: `Hello ${user.username || "Traveller"}, welcome to Wanderlust! Discover and book your next stay with us.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2 style="color:#fe424d">Welcome to Wanderlust!</h2>
                <p>Hello ${username},</p>
                <p>Your account has been created successfully.</p>
                <p>Discover wonderful stays and plan your next trip.</p>
                <a href="${escapeHtml(process.env.APP_URL || "http://localhost:8080")}/listings"
                   style="background:#fe424d;color:white;padding:12px 18px;text-decoration:none;border-radius:6px;display:inline-block">
                    Explore Listings
                </a>
            </div>
        `
    });
}

async function sendBookingConfirmation({ booking, listing, guest, owner }) {
    const title = escapeHtml(listing.title);
    const checkIn = formatDate(booking.checkIn);
    const checkOut = formatDate(booking.checkOut);
    const amount = Number(booking.totalPrice).toLocaleString("en-IN");
    const bookingId = escapeHtml(booking._id);

    const details = `
        <h3>${title}</h3>
        <p><b>Booking ID:</b> ${bookingId}</p>
        <p><b>Check-in:</b> ${checkIn}</p>
        <p><b>Check-out:</b> ${checkOut}</p>
        <p><b>Total amount:</b> ₹${amount}</p>
    `;

    const guestName = escapeHtml(guest.username || "Guest");

    const guestEmail = sendEmail({
        to: guest.email,
        subject: `Booking confirmed: ${listing.title}`,
        text: `Hello ${guest.username || "Guest"}, your booking for ${listing.title} is confirmed. Check-in: ${checkIn}. Check-out: ${checkOut}. Total: Rs. ${amount}. Booking ID: ${booking._id}.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2 style="color:#fe424d">Booking confirmed!</h2>
                <p>Hello ${guestName}, your payment was verified successfully.</p>
                ${details}
                <p>Thank you for booking with Wanderlust.</p>
            </div>
        `
    });

    const ownerEmail = owner?.email
        ? sendEmail({
            to: owner.email,
            subject: `New booking received: ${listing.title}`,
            text: `Hello ${owner.username || "Host"}, your property ${listing.title} has been booked. Guest: ${guest.username || "Guest"}. Check-in: ${checkIn}. Check-out: ${checkOut}. Booking amount: Rs. ${amount}. Booking ID: ${booking._id}.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                    <h2 style="color:#fe424d">You have a new booking!</h2>
                    <p>Hello ${escapeHtml(owner.username || "Host")},</p>
                    <p>Your property has received a confirmed booking.</p>
                    ${details}
                    <p><b>Guest:</b> ${guestName}</p>
                    <p>Please check your Wanderlust dashboard for booking details.</p>
                </div>
            `
        })
        : Promise.resolve(false);

    await Promise.all([guestEmail, ownerEmail]);
}

async function sendPaymentConfirmation({ booking, listing, guest }) {
    const amount = Number(booking.totalPrice).toLocaleString("en-IN");

    return sendEmail({
        to: guest.email,
        subject: `Payment received: ${listing.title}`,
        text: `Hello ${guest.username || "Guest"}, your payment of Rs. ${amount} for ${listing.title} has been verified. Payment ID: ${booking.razorpayPaymentId || "Not available"}. Booking ID: ${booking._id}.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                <h2 style="color:#fe424d">Payment successful</h2>
                <p>Hello ${escapeHtml(guest.username || "Guest")},</p>
                <p>Your payment has been verified successfully.</p>
                <p><b>Property:</b> ${escapeHtml(listing.title)}</p>
                <p><b>Amount paid:</b> ₹${amount}</p>
                <p><b>Payment ID:</b> ${escapeHtml(booking.razorpayPaymentId || "Not available")}</p>
                <p><b>Booking ID:</b> ${escapeHtml(booking._id)}</p>
            </div>
        `
    });
}

async function sendCancellationEmails({ booking, listing, guest, owner }) {
    const checkIn = formatDate(booking.checkIn);
    const checkOut = formatDate(booking.checkOut);
    const title = escapeHtml(listing.title);

    const message = `
        <p><b>Property:</b> ${title}</p>
        <p><b>Check-in:</b> ${checkIn}</p>
        <p><b>Check-out:</b> ${checkOut}</p>
        <p><b>Booking ID:</b> ${escapeHtml(booking._id)}</p>
        <p>If a refund applies, please check the payment/refund status separately.</p>
    `;

    const guestEmail = sendEmail({
        to: guest.email,
        subject: `Booking cancelled: ${listing.title}`,
        text: `Your booking for ${listing.title} has been cancelled. Check-in: ${checkIn}. Check-out: ${checkOut}. Booking ID: ${booking._id}.`,
        html: `<div style="font-family:Arial,sans-serif"><h2>Booking cancelled</h2>${message}</div>`
    });

    const ownerEmail = owner?.email
        ? sendEmail({
            to: owner.email,
            subject: `Booking cancellation: ${listing.title}`,
            text: `A booking for your property ${listing.title} has been cancelled. Check-in: ${checkIn}. Check-out: ${checkOut}. Booking ID: ${booking._id}.`,
            html: `<div style="font-family:Arial,sans-serif"><h2>Booking cancellation notice</h2>${message}</div>`
        })
        : Promise.resolve(false);

    await Promise.all([guestEmail, ownerEmail]);
}

module.exports = {
    sendWelcomeEmail,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendCancellationEmails
};
