import express from "express";
//import mongoose from "mongoose";

//import Report from "../models/report.model.js";
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  updateReportStatus,
  deleteReport,
  getNearbyReports,
  getUserReports
} from '../controllers/report.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post("/", auth, createReport);

// @route   GET /api/reports/nearby
// @desc    Get reports near a location
// @access  Public
router.get("/nearby", getNearbyReports);

// @route   GET /api/reports/user/my-reports
// @desc    Get user's reports
// @access  Private
router.get("/user/my-reports", auth, getUserReports);

// @route   GET /api/reports
// @desc    Get all reports
// @access  Public
router.get("/", getReports);

// @route   GET /api/reports/:id
// @desc    Get a single report by ID
// @access  Public
router.get("/:id", getReportById);

// @route   PUT /api/reports/:id
// @desc    Update a report
// @access  Private
router.put("/:id", auth, updateReport);

// @route   PUT /api/reports/:id/status
// @desc    Update a report's status
// @access  Private
router.put("/:id/status", auth, updateReportStatus);

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete("/:id", auth, deleteReport);

export default router;

