const sampleListings = [
    {
        title: "Cozy Beachfront Cottage",
        description:
            "A charming cottage right on the beach with stunning ocean views.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        },
        price: 1200,
        location: "Malibu",
        country: "United States",
        category: "Trending",
    },
    {
        title: "Modern Loft in Downtown",
        description:
            "A stylish loft in the heart of the city, perfect for urban explorers.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        },
        price: 1500,
        location: "New York City",
        country: "United States",
        category: "Iconic Cities",
    },
    {
        title: "Mountain Retreat",
        description:
            "A peaceful retreat nestled in the mountains, perfect for nature lovers.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
        },
        price: 900,
        location: "Aspen",
        country: "United States",
        category: "Mountains",
    },
    {
        title: "Historic Villa in Tuscany",
        description:
            "Experience the beauty of Tuscany in this historic villa surrounded by vineyards.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        },
        price: 2200,
        location: "Tuscany",
        country: "Italy",
        category: "Creative spaces",
    },
    {
        title: "Secluded Treehouse Getaway",
        description:
            "A unique treehouse surrounded by nature, offering peace and privacy.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1520984032042-162d526883e0",
        },
        price: 800,
        location: "Portland",
        country: "United States",
        category: "Camping",
    },
    {
        title: "Beachfront Paradise",
        description:
            "A luxurious beachfront property with a private pool and breathtaking views.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
        },
        price: 3000,
        location: "Miami",
        country: "United States",
        category: "Amazing pools",
    },
    {
        title: "Rustic Cabin by the Lake",
        description:
            "A cozy cabin overlooking a serene lake, ideal for a relaxing escape.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        },
        price: 700,
        location: "Lake Tahoe",
        country: "United States",
        category: "Mountains",
    },
    {
        title: "Luxury Penthouse with City Views",
        description:
            "An elegant penthouse offering panoramic views of the city skyline.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1502672023488-70e25813eb80",
        },
        price: 3500,
        location: "Chicago",
        country: "United States",
        category: "Iconic Cities",
    },
    {
        title: "Ski-In/Ski-Out Chalet",
        description:
            "A luxurious chalet located directly on the ski slopes.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
        },
        price: 2800,
        location: "Whistler",
        country: "Canada",
        category: "Mountains",
    },
    {
        title: "Safari Lodge in the Serengeti",
        description:
            "Stay in the heart of the Serengeti and experience incredible wildlife.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1516426122078-c23e76319801",
        },
        price: 3200,
        location: "Serengeti",
        country: "Tanzania",
        category: "Camping",
    },
    {
        title: "Historic Canal House",
        description:
            "A beautiful historic house located along the famous canals.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017",
        },
        price: 1800,
        location: "Amsterdam",
        country: "Netherlands",
        category: "Iconic Cities",
    },
    {
        title: "Private Island Retreat",
        description:
            "An exclusive private island getaway surrounded by crystal-clear waters.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1505881502353-a1986add3762",
        },
        price: 5000,
        location: "Maldives",
        country: "Maldives",
        category: "Trending",
    },
    {
        title: "Charming Cottage in the Cotswolds",
        description:
            "A charming English cottage surrounded by beautiful countryside.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
        },
        price: 1100,
        location: "Cotswolds",
        country: "United Kingdom",
        category: "Farms",
    },
    {
        title: "Historic Brownstone in Boston",
        description:
            "A classic Boston brownstone located in a historic neighborhood.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1605146769289-440113cc3d00",
        },
        price: 1600,
        location: "Boston",
        country: "United States",
        category: "Iconic Cities",
    },
    {
        title: "Beachfront Bungalow in Bali",
        description:
            "A beautiful tropical bungalow just steps away from the beach.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
        },
        price: 1400,
        location: "Bali",
        country: "Indonesia",
        category: "Amazing pools",
    },
    {
        title: "Mountain View Cabin in Banff",
        description:
            "A cozy cabin offering spectacular views of the Canadian Rockies.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
        },
        price: 1300,
        location: "Banff",
        country: "Canada",
        category: "Mountains",
    },
    {
        title: "Art Deco Apartment in Miami",
        description:
            "A stylish Art Deco apartment located near Miami Beach.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
        },
        price: 1700,
        location: "Miami",
        country: "United States",
        category: "Creative spaces",
    },
    {
        title: "Tropical Villa in Phuket",
        description:
            "A luxurious tropical villa with a private pool and ocean views.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1582610116397-edb318620f90",
        },
        price: 2500,
        location: "Phuket",
        country: "Thailand",
        category: "Amazing pools",
    },
    {
        title: "Historic Castle in Scotland",
        description:
            "Stay in a beautiful historic castle surrounded by Scottish countryside.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
        },
        price: 4000,
        location: "Scotland",
        country: "United Kingdom",
        category: "Castles",
    },
    {
        title: "Desert Oasis in Dubai",
        description:
            "A luxurious desert retreat offering a unique Arabian experience.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1518684079-3c830dcef090",
        },
        price: 2900,
        location: "Dubai",
        country: "United Arab Emirates",
        category: "Trending",
    },
    {
        title: "Rustic Log Cabin in Montana",
        description:
            "A peaceful log cabin surrounded by forests and mountains.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
        },
        price: 950,
        location: "Montana",
        country: "United States",
        category: "Camping",
    },
    {
        title: "Beachfront Villa in Greece",
        description:
            "A stunning Mediterranean villa overlooking the Aegean Sea.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
        },
        price: 2700,
        location: "Santorini",
        country: "Greece",
        category: "Amazing pools",
    },
    {
        title: "Eco-Friendly Treehouse Retreat",
        description:
            "An eco-friendly treehouse surrounded by lush forests.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
        },
        price: 1000,
        location: "Costa Rica",
        country: "Costa Rica",
        category: "Camping",
    },
    {
        title: "Historic Cottage in Charleston",
        description:
            "A charming historic cottage in the heart of Charleston.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        },
        price: 1250,
        location: "Charleston",
        country: "United States",
        category: "Iconic Cities",
    },
    {
        title: "Modern Apartment in Tokyo",
        description:
            "A modern apartment located in the heart of Tokyo.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1554995207-c18c203602cb",
        },
        price: 1900,
        location: "Tokyo",
        country: "Japan",
        category: "Iconic Cities",
    },
    {
        title: "Lakefront Cabin in New Hampshire",
        description:
            "A peaceful cabin directly on the lake, surrounded by nature.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
        },
        price: 850,
        location: "New Hampshire",
        country: "United States",
        category: "Mountains",
    },
    {
        title: "Luxury Villa in the Maldives",
        description:
            "A luxurious overwater villa with direct access to the ocean.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8",
        },
        price: 4500,
        location: "Maldives",
        country: "Maldives",
        category: "Amazing pools",
    },
    {
        title: "Ski Chalet in Aspen",
        description:
            "A luxurious ski chalet close to the slopes of Aspen.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1548777123-e216912df7d8",
        },
        price: 3000,
        location: "Aspen",
        country: "United States",
        category: "Mountains",
    },
    {
        title: "Secluded Beach House in Costa Rica",
        description:
            "A private beach house surrounded by tropical nature.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
        },
        price: 2100,
        location: "Costa Rica",
        country: "Costa Rica",
        category: "Amazing pools",
    },
];

module.exports = { data: sampleListings };