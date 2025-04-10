const express = require('express');
const router = express.Router();
const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

// Get address from coordinates
router.get('/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const response = await client.geocode({
      params: {
        latlng: [parseFloat(lat), parseFloat(lng)],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ msg: 'No address found' });
    }

    res.json({
      address: response.data.results[0].formatted_address,
      location: response.data.results[0].geometry.location
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get coordinates from address
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { address } = req.query;

    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ msg: 'No location found' });
    }

    res.json({
      location: response.data.results[0].geometry.location,
      address: response.data.results[0].formatted_address
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Check if location is within Toronto boundaries
router.get('/check-boundaries', async (req, res) => {
  try {
    const { lat, lng } = req.query;

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

    res.json({ isInToronto });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 