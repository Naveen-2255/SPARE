# 🤝 How to Contribute to SPARE

Thank you for helping us grow the SPARE platform! For this event, we are focusing on expanding our database of **Spare Parts Shops** and **DIY Repair Videos**.

You do not need deep React Native knowledge to contribute to these issues! You just need to know how to edit JSON files.

## 📍 How to Add a Spare Parts Shop
We store our initial shop data in `src/data/real_shops.json`.
1. Find a real two-wheeler spare parts shop on Google Maps.
2. Right-click the red pin on Google Maps to copy the **Latitude and Longitude**.
3. Open `src/data/real_shops.json` and add a new object to the array like this:
```json
{
  "name": "Exact Shop Name from Google Maps",
  "phone": "Enter 10 digit phone number (or 0000000000 if not available)",
  "latitude": 12.9716, 
  "longitude": 77.5946,
  "address": "Street Name, City",
  "status": "approved",
}
```
## We store video links inside our parts inventory so riders can learn how to install them
1. Find a high-quality YouTube tutorial for a specific bike repair (e.g., "Change Splendor Headlight").
2. Get the Video ID from the URL (the text after v=). Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ -> ID is dQw4w9WgXcQ.
3. Open src/screens/VedioHubScreen.
4. Find the relevant spare part in the "parts" array and update its "video_id" field.
