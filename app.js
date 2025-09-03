class FoodWheelApp {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.spinButton = document.getElementById('spinButton');
        this.resultSection = document.getElementById('resultSection');
        this.locationStatus = document.getElementById('locationStatus');
        
        this.spinner = new WheelSpinner(this.canvas);
        this.userLocation = null;
        this.userCity = "Loading...";
        this.isSpinning = false;
        this.searchRadius = 2000; // 2km radius
        
        this.init();
    }

    init() {
        this.requestLocation();
        this.spinner.drawWheel();
        this.spinButton.addEventListener('click', () => this.spinWheel());
        this.canvas.addEventListener('click', () => this.spinWheel());
    }

    async requestLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Get city name from coordinates
                    try {
                        const cityName = await this.getCityName(this.userLocation.lat, this.userLocation.lng);
                        this.userCity = cityName;
                        this.locationStatus.textContent = `📍 ${this.userCity}`;
                    } catch (error) {
                        this.locationStatus.textContent = `📍 Location found`;
                    }
                    
                    setTimeout(() => {
                        this.locationStatus.style.opacity = '0';
                    }, 3000);
                },
                (error) => {
                    this.locationStatus.textContent = '📍 Please enable location for better results';
                    this.userLocation = { lat: 3.139, lng: 101.6869 }; // Default to KL
                    this.userCity = "Kuala Lumpur";
                }
            );
        } else {
            this.locationStatus.textContent = '📍 Location not supported';
            this.userLocation = { lat: 3.139, lng: 101.6869 }; // Default to KL
            this.userCity = "Kuala Lumpur";
        }
    }

    async getCityName(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
            const data = await response.json();
            
            if (data.address) {
                return data.address.city || 
                       data.address.town || 
                       data.address.village || 
                       data.address.suburb || 
                       data.address.county || 
                       "Your Location";
            }
            return "Your Location";
        } catch (error) {
            console.error('Error getting city name:', error);
            return "Your Location";
        }
    }

    async spinWheel() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.spinButton.textContent = '🎯 SPINNING...';
        
        try {
            const winningFood = await this.spinner.spin();
            this.showResult(winningFood);
        } catch (error) {
            console.error('Error during spin:', error);
        }
        
        this.isSpinning = false;
        this.spinButton.disabled = false;
        this.spinButton.textContent = '🎯 SPIN AGAIN!';
    }

    async showResult(food) {
        // Update result display
        document.getElementById('foodEmoji').textContent = food.emoji;
        document.getElementById('foodName').textContent = food.name;
        
        // Show loading state
        const restaurantsContainer = document.getElementById('restaurants');
        restaurantsContainer.innerHTML = `
            <div class="loading-restaurants">
                <div class="spinner"></div>
                <span>Finding nearby ${food.name.toLowerCase()} places...</span>
            </div>
        `;
        
        // Show result section with animation
        this.resultSection.classList.add('show');
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Fetch real restaurants
        await this.fetchNearbyRestaurants(food);
    }

    async fetchNearbyRestaurants(food) {
        if (!this.userLocation) {
            this.showError("Location not available. Please enable location access.");
            return;
        }

        try {
            const restaurants = await this.queryOverpassAPI(food.query, this.userLocation.lat, this.userLocation.lng);
            this.displayRestaurants(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            this.showError(`Sorry, couldn't find nearby ${food.name.toLowerCase()} places. Please try again.`);
        }
    }

    async queryOverpassAPI(query, lat, lng) {
        const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"]["cuisine"~"${query}",i](around:${this.searchRadius},${lat},${lng});
          node["amenity"="fast_food"]["cuisine"~"${query}",i](around:${this.searchRadius},${lat},${lng});
          node["amenity"="cafe"]["name"~"${query}",i](around:${this.searchRadius},${lat},${lng});
          node["shop"="bakery"](around:${this.searchRadius},${lat},${lng});
          node["amenity"="restaurant"]["name"~"${query}",i](around:${this.searchRadius},${lat},${lng});
          node["amenity"="fast_food"]["name"~"${query}",i](around:${this.searchRadius},${lat},${lng});
        );
        out body;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
                'Content-Type': 'text/plain',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from Overpass API');
        }

        const data = await response.json();
        
        // Process and sort restaurants by distance
        const restaurants = data.elements
            .filter(element => element.tags && element.tags.name)
            .map(element => ({
                name: element.tags.name,
                lat: element.lat,
                lon: element.lon,
                cuisine: element.tags.cuisine || 'Restaurant',
                amenity: element.tags.amenity || 'restaurant',
                distance: this.calculateDistance(lat, lng, element.lat, element.lon),
                address: element.tags['addr:street'] || element.tags['addr:city'] || '',
                phone: element.tags.phone || '',
                website: element.tags.website || '',
                opening_hours: element.tags.opening_hours || ''
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 8); // Limit to 8 results

        return restaurants;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLng = this.deg2rad(lng2 - lng1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    displayRestaurants(restaurants) {
        const restaurantsContainer = document.getElementById('restaurants');
        
        if (restaurants.length === 0) {
            restaurantsContainer.innerHTML = `
                <div class="error-message">
                    <div>😔 No restaurants found nearby</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">Try spinning for another food type!</div>
                </div>
            `;
            return;
        }

        restaurantsContainer.innerHTML = '';
        
        restaurants.forEach(restaurant => {
            const distanceText = restaurant.distance < 1 
                ? `${Math.round(restaurant.distance * 1000)}m` 
                : `${restaurant.distance.toFixed(1)}km`;
            
            const restaurantCard = document.createElement('div');
            restaurantCard.className = 'restaurant-card';
            
            // Create Google Maps URL
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}&center=${restaurant.lat},${restaurant.lon}`;
            
            restaurantCard.onclick = () => window.open(mapsUrl, '_blank');
            
            restaurantCard.innerHTML = `
                <div class="restaurant-info">
                    <div class="restaurant-name">${restaurant.name}</div>
                    <div class="restaurant-details">
                        ${restaurant.cuisine} • ${restaurant.amenity}
                        ${restaurant.address ? ' • ' + restaurant.address : ''}
                    </div>
                    ${restaurant.opening_hours ? `<div class="restaurant-details">🕒 ${restaurant.opening_hours}</div>` : ''}
                </div>
                <div class="rating">
                    <div class="distance">${distanceText}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">📍 View on map</div>
                </div>
            `;
            restaurantsContainer.appendChild(restaurantCard);
        });
    }

    showError(message) {
        console.log('⚠️ Showing error:', message);
        const restaurantsContainer = document.getElementById('restaurants');
        
        if (!restaurantsContainer) {
            console.error('❌ Cannot find restaurants container element!');
            return;
        }
        
        restaurantsContainer.innerHTML = `
            <div class="error-message">
                <div>⚠️ ${message}</div>
                <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                    This might be due to:
                    <ul style="text-align: left; margin: 0.5rem 0; padding-left: 1.5rem;">
                        <li>Limited restaurant data in your area</li>
                        <li>Internet connectivity issues</li>
                        <li>API temporary unavailability</li>
                    </ul>
                </div>
                <button onclick="window.foodApp.searchAllRestaurants()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: white; cursor: pointer;">
                    🏪 Try Finding All Restaurants
                </button>
                <button onclick="window.foodApp.testConnection()" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: white; cursor: pointer;">
                    🔧 Test API Connection
                </button>
            </div>
        `;
    }

    // NEW: Test if the API is working at all
    async testConnection() {
        console.log('🔧 Testing API connection...');
        const restaurantsContainer = document.getElementById('restaurants');
        
        restaurantsContainer.innerHTML = `
            <div class="loading-restaurants">
                <div class="spinner"></div>
                <span>Testing API connection...</span>
            </div>
        `;
        
        try {
            // Simple test query - just get one restaurant anywhere in KL
            const testQuery = `
            [out:json][timeout:10];
            (
              node["amenity"="restaurant"](around:50000,3.139,101.687);
            );
            out body 1;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: testQuery,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            
            if (!response.ok) {
                throw new Error(`API test failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.elements && data.elements.length > 0) {
                restaurantsContainer.innerHTML = `
                    <div style="background: rgba(0,255,0,0.2); border: 1px solid rgba(0,255,0,0.3); border-radius: 10px; padding: 1rem; text-align: center;">
                        ✅ API Connection Working!<br>
                        <small>Found test restaurant: ${data.elements[0].tags?.name || 'Unnamed restaurant'}</small><br>
                        <small>Your location: ${this.userLocation?.lat?.toFixed(3)}, ${this.userLocation?.lng?.toFixed(3)}</small><br>
                        <small>Search radius: ${this.searchRadius}m</small>
                    </div>
                `;
                console.log('✅ API test successful:', data);
            } else {
                restaurantsContainer.innerHTML = `
                    <div class="error-message">
                        ⚠️ API works but no restaurants found in test area<br>
                        <small>You might be in a very rural location</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ API test failed:', error);
            restaurantsContainer.innerHTML = `
                <div class="error-message">
                    ❌ API Connection Failed<br>
                    <small>Error: ${error.message}</small><br>
                    <small>Check your internet connection</small>
                </div>
            `;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.foodApp = new FoodWheelApp(); // Make it globally accessible
});
