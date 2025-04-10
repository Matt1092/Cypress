const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { Client } = require('@googlemaps/google-maps-services-js');
const { OpenAI } = require('openai');

const client = new Client({});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware to verify JWT token
const auth = require('../middleware/auth');

// Create new report
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, location, images } = req.body;

    // Check for duplicate reports within 5 meters
    const duplicateReport = await Report.findOne({
      type,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: 5 // 5 meters
        }
      }
    });

    if (duplicateReport) {
      return res.status(400).json({ msg: 'Problem already reported' });
    }

    // Get address from coordinates using Google Maps API
    const geocodeResponse = await client.geocode({
      params: {
        latlng: location.coordinates,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    const address = geocodeResponse.data.results[0]?.formatted_address || 'Unknown location';

    // Generate category using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Generate a short category (less than 5 words) for the following problem description:"
        },
        {
          role: "user",
          content: description
        }
      ]
    });

    const category = completion.choices[0]?.message?.content?.trim() || 'Uncategorized';

    // Create new report
    const report = new Report({
      user: req.user.id,
      type,
      description,
      location,
      address,
      images,
      category
    });

    await report.save();

    res.status(201).json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get reports by location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query; // radius in meters

    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .populate('user', 'username')
    .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update report status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check if user is the reporter or has verified the report
    if (report.user.toString() !== req.user.id) {
      report.verificationCount += 1;
      if (report.verificationCount >= 2) {
        report.status = status;
      }
    } else {
      report.status = status;
    }

    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check if user is the reporter
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await report.remove();
    res.json({ msg: 'Report removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 