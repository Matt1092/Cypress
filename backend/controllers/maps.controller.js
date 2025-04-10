import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

// Get address from coordinates
export const getAddressFromCoordinates = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude are required" 
      });
    }

    const response = await client.geocode({
      params: {
        latlng: [parseFloat(lat), parseFloat(lng)],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ success: false, message: "No address found" });
    }

    res.json({
      success: true,
      data: {
        address: response.data.results[0].formatted_address,
        location: response.data.results[0].geometry.location
      }
    });
  } catch (error) {
    console.error("Error in geocoding:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get coordinates from address
export const getCoordinatesFromAddress = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ 
        success: false, 
        message: "Address is required" 
      });
    }

    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ success: false, message: "No location found" });
    }

    res.json({
      success: true,
      data: {
        location: response.data.results[0].geometry.location,
        address: response.data.results[0].formatted_address
      }
    });
  } catch (error) {
    console.error("Error in reverse geocoding:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Check if location is within Toronto boundaries
export const checkBoundaries = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: "Latitude and longitude are required" 
      });
    }

    // Toronto boundaries (approximate)
    const torontoBounds = {
      north: 43.8554579,
      south: 43.5810245,
      east: -79.1157305,
      west: -79.639219
    };

    const isInToronto = (
      parseFloat(lat) >= torontoBounds.south &&
      parseFloat(lat) <= torontoBounds.north &&
      parseFloat(lng) >= torontoBounds.west &&
      parseFloat(lng) <= torontoBounds.east
    );

    res.json({ 
      success: true, 
      data: { isInToronto } 
    });
  } catch (error) {
    console.error("Error in checking boundaries:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}; 