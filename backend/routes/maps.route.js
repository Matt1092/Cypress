import express from 'express';
import {
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  checkBoundaries
} from '../controllers/maps.controller.js';

const router = express.Router();

// @route   GET /api/maps/geocode
// @desc    Get address from coordinates
// @access  Public
router.get('/geocode', getAddressFromCoordinates);

// @route   GET /api/maps/reverse-geocode
// @desc    Get coordinates from address
// @access  Public
router.get('/reverse-geocode', getCoordinatesFromAddress);

// @route   GET /api/maps/check-boundaries
// @desc    Check if location is within Toronto boundaries
// @access  Public
router.get('/check-boundaries', checkBoundaries);

export default router; 