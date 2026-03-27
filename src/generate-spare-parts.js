// filepath: c:\Users\Sandra\Desktop\SPARE-master (1)\SPARE-master\generate-spare-parts.js
const fs = require("fs");

const BIKE_DATABASE = require("./data/bike_database.json"); // save your bike DB separately

const masterParts = [
  { name: "Engine Oil", category: "Engine" },
  { name: "Oil Filter", category: "Engine" },
  { name: "Air Filter", category: "Engine" },
  { name: "Spark Plug", category: "Engine" },
  { name: "Clutch Plate Set", category: "Engine" },
  { name: "Fuel Pump", category: "Engine" },
  { name: "Battery", category: "Electrical" },
  { name: "Headlight Assembly", category: "Electrical" },
  { name: "Tail Light", category: "Electrical" },
  { name: "Starter Motor", category: "Electrical" },
  { name: "Front Brake Pads", category: "Brakes" },
  { name: "Rear Brake Pads", category: "Brakes" },
  { name: "Brake Disc Rotor", category: "Brakes" },
  { name: "Chain Sprocket Kit", category: "Transmission" },
  { name: "Drive Belt", category: "Transmission" },
  { name: "Clutch Cable", category: "Transmission" },
  { name: "Throttle Cable", category: "Transmission" },
  { name: "Front Fork", category: "Suspension" },
  { name: "Rear Shock Absorber", category: "Suspension" },
  { name: "Front Fender", category: "Body" },
  { name: "Rear Fender", category: "Body" },
  { name: "Side Panel", category: "Body" },
  { name: "Fuel Tank", category: "Body" },
  { name: "Seat Assembly", category: "Body" },
  { name: "Front Tyre", category: "Wheels" },
  { name: "Rear Tyre", category: "Wheels" },
  { name: "Alloy Wheel", category: "Wheels" }
];

let spareParts = [];
let idCounter = 1;

BIKE_DATABASE.forEach(brandObj => {
  brandObj.models.forEach(model => {
    masterParts.forEach(part => {
      spareParts.push({
        part_id: `part_${idCounter.toString().padStart(5, "0")}`,
        brand: brandObj.brand,
        bike_model: model,
        name: part.name,
        category: part.category,
        price: (Math.floor(Math.random() * 9000) + 300).toString(),
        in_stock: Math.random() > 0.2,
        rating: +(Math.random() * 2 + 3).toFixed(1),
        warranty_months: [3, 6, 12][Math.floor(Math.random() * 3)],
        delivery_time_days: Math.floor(Math.random() * 5) + 1,
        image_url: "",
        product_page: ""
      });

      idCounter++;
    });
  });
});

fs.writeFileSync(
  "all_bike_spare_parts.json",
  JSON.stringify({ spare_parts: spareParts }, null, 2)
);

console.log("✅ All spare parts JSON generated successfully!");