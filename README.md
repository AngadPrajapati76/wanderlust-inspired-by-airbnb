# Wanderlust — Full-Stack Stay Booking Platform

Wanderlust is a full-stack accommodation booking web application inspired by Airbnb. It allows users to discover properties, search destinations, filter listings, save favorite stays, and manage bookings. Property owners can manage their listings and receive notifications about booking activities.

**Live Website:** https://wanderlust-s39t.onrender.com

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Application Workflow](#application-workflow)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Features

### User Authentication and Profiles
- User registration, login, and logout.
- Authentication and authorization using Passport.js.
- User profile viewing and management.

### Property Listings
- Create, view, update, and delete property listings.
- Search listings by destination.
- Filter properties by category and price range.
- View property details, images, location, and reviews.
- Upload property images using Cloudinary.

### Booking and Payments
- Create and manage property bookings.
- View booking history and booking details.
- Cancel eligible confirmed bookings.
- Online payment integration using Razorpay.
- Server-side payment signature verification.

### Wishlist
- Save favorite properties.
- Access saved listings through a dedicated wishlist page.

### Notifications and Email
- Welcome emails after successful registration.
- Booking confirmation emails.
- Payment confirmation emails.
- Booking cancellation emails.
- In-app notifications for booking-related activities.

### Maps and Reviews
- Location-based features using Mapbox.
- Submit and view property reviews.
- Associate reviews with users and listings.

### User Interface
- Responsive layout using HTML, CSS, Bootstrap, and JavaScript.
- Reusable EJS layouts and partial templates.
- Navigation, flash messages, and listing filters.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, EJS, Bootstrap |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose, MongoDB Atlas |
| Authentication | Passport.js, Express Session |
| Image Management | Cloudinary |
| Maps and Geocoding | Mapbox |
| Payments | Razorpay |
| Email Notifications | Nodemailer, Gmail SMTP |
| Templating | EJS, EJS-Mate |
| Deployment | Render |
| Version Control | Git, GitHub |

## Project Structure

majorProject/
├── controllers/
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
│
├── init/
│   ├── data.js
│   └── index.js
│
├── models/
│   ├── booking.js
│   ├── listing.js
│   ├── notification.js
│   ├── review.js
│   ├── user.js
│   └── wishlist.js
│
├── public/
│   ├── css/
│   │   ├── rating.css
│   │   └── style.css
│   └── js/
│       ├── map.js
│       └── script.js
│
├── routes/
│   ├── booking.js
│   ├── listing.js
│   ├── review.js
│   ├── user.js
│   └── wishlist.js
│
├── utils/
│   ├── email.js
│   ├── ExpressError.js
│   └── wrapAsync.js
│
├── views/
│   ├── booking/
│   │   ├── confirm.ejs
│   │   ├── dashboard.ejs
│   │   ├── index.ejs
│   │   ├── notifications.ejs
│   │   └── owner.ejs
│   │
│   ├── includes/
│   │   ├── flash.ejs
│   │   ├── footer.ejs
│   │   └── navbar.ejs
│   │
│   ├── layouts/
│   │   └── boilerplate.ejs
│   │
│   ├── listing/
│   │   ├── edit.ejs
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   └── show.ejs
│   │
│   ├── users/
│   │   ├── login.ejs
│   │   ├── profile.ejs
│   │   └── signup.ejs
│   │
│   ├── wishlist/
│   │   └── index.ejs
│   │
│   └── error.ejs
│
├── app.js
├── cloudConfig.js
├── error.js
├── middleware.js
├── schema.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md


## Getting Started

### Prerequisites

Install or create accounts for the following services:

- [Node.js](https://nodejs.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance
- [Cloudinary](https://cloudinary.com/)
- [Mapbox](https://www.mapbox.com/)
- [Razorpay](https://razorpay.com/)
- A Gmail account for email notifications

### 1. Clone the Repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd majorProject
https://github.com/AngadPrajapati76/wanderlust-inspired-by-airbnb.git

### 2. Install Dependencies

npm install

### 3. Start the Application

Check the `scripts` section of `package.json` for the available commands.

Common commands are:

bash
npm start


The application may be available at:

http://localhost:8080

### 4. Initialize Sample Listings

The project contains an `init/` folder with `data.js` and `index.js` for initializing sample listing data.

If you intend to seed a database, inspect `init/index.js` and confirm that the configured database is the one you want to populate before running it.

## Application Workflow

1. Users register or log in to Wanderlust.
2. Users browse available properties and search by destination.
3. Category and price filters help users find suitable listings.
4. Users view property information, images, maps, and reviews.
5. Authenticated users can save properties to their wishlist.
6. Users create bookings and proceed through the Razorpay payment flow.
7. The application verifies payment information on the server before confirming the booking.
8. Booking-related events trigger applicable emails and in-app notifications.
9. Users can view their bookings and cancel eligible confirmed bookings.
10. Property owners can manage listings and review booking-related information.

## Deployment

Wanderlust is deployed on Render.

**Live Website:** https://wanderlust-s39t.onrender.com

To deploy your own instance:

1. Push the project to a GitHub repository.
2. Create a Web Service on [Render](https://render.com/) and connect the repository.
3. Set the build command to `npm install`.
4. Set the start command to match the script in your `package.json`.
5. Add the required environment variables in the Render dashboard.
6. Deploy the application and inspect the deployment logs.
7. Test database connectivity, authentication, listings, image uploads, booking, payment verification, and email notifications.

Keep development and production credentials separate. Use Razorpay test mode for development and testing, and configure production credentials securely when appropriate.

## Future Improvements

- Optimize listing image delivery and homepage loading performance.
- Add pagination and improve database query performance.
- Improve booking availability management.
- Expand the owner dashboard and administrative tools.
- Add automated tests for booking and payment workflows.
- Improve error monitoring, accessibility, and application security.

## Author

**Angad Prajapati**

Full-Stack Web Development Project

- GitHub: [AngadPrajapati76](https://github.com/AngadPrajapati76)

## License

This project is intended for educational and portfolio purposes. Add a `LICENSE` file if you want to define the terms under which others may use, modify, or distribute the project.
