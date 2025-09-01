🍜 What to Eat - Free Food Discovery Wheel
A fun, interactive web app that helps you decide what to eat by spinning a colorful food wheel and discovering nearby restaurants - completely FREE with no API costs!

✨ Features
🎯 Interactive Spinning Wheel with 12 food categories
📍 Location-Based Restaurant Discovery using OpenStreetMap
🏪 Real-Time Restaurant Data from Overpass API (free!)
🗺️ Google Maps Integration for directions
📱 Mobile Responsive Design
🎨 Beautiful Animations & Effects
🌍 Works Worldwide - no regional restrictions
🆓 Why This is 100% Free
✅ No paid APIs - uses free OpenStreetMap Overpass API
✅ No backend server - runs entirely in browser
✅ No registration - deploy on GitHub Pages for free
✅ No usage limits - unlike Google Places API
🚀 Quick Start
Clone this repository
bash
git clone https://github.com/yourusername/what-to-eat.git
cd what-to-eat
Enable GitHub Pages
Go to your repo settings
Scroll to "Pages" section
Set source to "Deploy from a branch"
Select "main" branch and "/ (root)"
Access your app
Visit https://yourusername.github.io/what-to-eat
Allow location access for best results
📁 Project Structure
what-to-eat/
├── index.html          # Main HTML structure
├── style.css          # All styling and animations
├── spinner.js         # Wheel spinning logic
├── app.js            # Main app logic & API calls
└── README.md         # This documentation
🛠️ How It Works
1. Wheel Spin
Canvas-based spinning wheel with 12 food categories
Smooth animations with CSS transforms
Random selection with realistic physics
2. Location Detection
Browser's Geolocation API gets user coordinates
OpenStreetMap Nominatim API converts to city name
Falls back to Kuala Lumpur if location unavailable
3. Restaurant Discovery
Uses Overpass API (OpenStreetMap's query service)
Searches for restaurants within 2km radius
Filters by food category, cuisine, and restaurant names
Sorts results by distance
4. Results Display
Shows restaurant cards with name, cuisine, distance
Click to open in Google Maps for directions
Displays opening hours when available
🔧 Customization
Add More Food Categories
Edit the foodOptions array in spinner.js:

javascript
{ name: 'Tacos', emoji: '🌮', color: '#ff6b35', query: 'tacos' }
Modify Search Radius
Change searchRadius in app.js:

javascript
this.searchRadius = 5000; // 5km radius
Update Styling
Modify colors and animations in style.css:

css
.spin-button {
    background: linear-gradient(45deg, #your-color1, #your-color2);
}
🌍 API Details
OpenStreetMap Overpass API
Endpoint: `https://overpass-api.de/api/
