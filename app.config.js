require('dotenv').config();

module.exports = {
    expo: {
        name: "spare",
        slug: "spare",
        icon: "./assets/icon.png",
        platforms: ["android", "web"],
        extra: {
            eas: {
                projectId: "f8761e6b-bec7-4366-920e-ef7e397f9463",
            },
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
        android: {
            package: "com.nj2255.spare",
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        },
        plugins: [
            "expo-font",
            [
                "expo-location",
                {
                    "locationAlwaysAndWhenInUsePermission": "Allow SPARE to use your location for finding nearby mechanics."
                }
            ]
        ],
    },
};
