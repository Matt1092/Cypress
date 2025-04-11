import mongoose from "mongoose";
import Report from "../models/report.model.js";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

// Get all reports
export const getReports = async (req, res) => {
    try {
        // Only return reports with valid location data
        const reports = await Report.find({
            location: { $exists: true },
            'location.coordinates': { $exists: true, $type: 'array', $ne: [] }
        })
        .populate('user', 'username')
        .sort({ createdAt: -1 });
        
        // Additional validation to ensure coordinates are valid
        const validReports = reports.filter(report => 
            report.location && 
            report.location.coordinates && 
            Array.isArray(report.location.coordinates) && 
            report.location.coordinates.length === 2 &&
            !isNaN(report.location.coordinates[0]) && 
            !isNaN(report.location.coordinates[1])
        );
        
        if (validReports.length < reports.length) {
            console.log(`Filtered out ${reports.length - validReports.length} reports with invalid location data`);
        }
        
        res.status(200).json({ success: true, data: validReports });
    } catch (error) {
        console.log("Error in fetching reports:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get single report by ID
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Invalid report ID" });
        }
        
        const report = await Report.findById(id).populate('user', 'username');
        
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.log("Error in fetching report:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Create new report
export const createReport = async (req, res) => {
    try {
        const { name, description, userLocation, type, location, images } = req.body;
        
        console.log('Creating report with data:', { 
            name, description, userLocation, type, 
            location: location ? `coordinates: ${JSON.stringify(location.coordinates)}` : 'missing'
        });
        console.log('User ID from request:', req.user.id);

        // Validate required fields
        if (!name || !description || !userLocation || !type || !location) {
            console.error('Missing required fields:', { name, description, userLocation, type, location });
            return res.status(400).json({ 
                success: false, 
                message: "Please provide all required fields: name, description, userLocation, type, and location" 
            });
        }

        // Validate location format
        if (!location.type || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            console.error('Invalid location format:', location);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid location format. Expected: {type: 'Point', coordinates: [lng, lat]}" 
            });
        }

        // Check for duplicate reports within 5 meters
        try {
            // Find any existing reports (both active and resolved) at this location
            const existingReports = await Report.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: location.coordinates
                        },
                        $maxDistance: 5 // 5 meters
                    }
                }
            }).sort({ createdAt: -1 }); // Get most recent first

            if (existingReports.length > 0) {
                // Check if there are any active (non-solved) reports
                const activeReports = existingReports.filter(report => 
                    report.status !== 'Solved' && 
                    report.type === type
                );

                if (activeReports.length > 0) {
                    // There are active reports at this location with the same type
                    return res.status(400).json({ 
                        success: false, 
                        message: "A similar problem has already been reported nearby and is still being addressed. Please check existing reports." 
                    });
                }

                // If we get here, all reports at this location are solved
                console.log('All existing reports at this location are solved. Allowing new report.');
            }
        } catch (geoQueryError) {
            console.error('Error in duplicate report geo query:', geoQueryError.message);
            // Continue with report creation even if geo query fails
        }

        // If we get here, either:
        // 1. There are no reports at this location
        // 2. All reports at this location are solved
        // 3. The existing reports are of a different type

        // Skip Google Maps API call temporarily to avoid potential errors
        let address = 'Address pending';
        /*
        // Get address from coordinates using Google Maps API
        try {
            const geocodeResponse = await client.geocode({
                params: {
                    latlng: location.coordinates,
                    key: process.env.GOOGLE_MAPS_API_KEY
                }
            });
            address = geocodeResponse.data.results[0]?.formatted_address || 'Unknown location';
        } catch (geocodeError) {
            console.error('Error getting address from coordinates:', geocodeError.message);
            // Continue with unknown address
            address = 'Unknown location';
        }
        */

        // Determine category based on type
        let category;
        switch(type) {
            case 'infrastructure':
                category = 'Infrastructure Issue';
                break;
            case 'cleanliness':
                category = 'Cleanliness Problem';
                break;
            case 'human':
                category = 'Human-related Issue';
                break;
            default:
                category = 'General Problem';
        }

        // Create new report with Report Flagged status
        const newReport = new Report({
            name,
            description,
            userLocation,
            type,
            location,
            address,
            user: req.user.id,
            images: images || [],
            category,
            status: 'Report Flagged'  // Explicitly set the status
        });

        console.log('Saving new report with user ID:', req.user.id);
        await newReport.save();
        console.log('Report saved successfully');
        
        res.status(201).json({ success: true, data: newReport });
    } catch (error) {
        console.error("Error in creating report:", error);
        res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
};

// Update report
export const updateReport = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid report ID" });
    }

    try {
        const report = await Report.findById(id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        
        // Check if user is the reporter
        if (report.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "User not authorized to update this report" });
        }
        
        const updatedReport = await Report.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).populate('user', 'username');
            
        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) {
        console.error("Error in updating report:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update report status
export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Invalid report ID" });
        }
        
        // Validate the status is one of the allowed values
        const allowedStatuses = ['Report Flagged', 'Verified', 'In progress', 'Solved'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status. Must be one of: Report Flagged, Verified, In progress, Solved" 
            });
        }
        
        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
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
        res.json({ success: true, data: report });
    } catch (error) {
        console.error("Error in updating report status:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Delete report
export const deleteReport = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid report ID" });
    }

    try {
        const report = await Report.findById(id);
        
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        
        // Check if user is the reporter
        if (report.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "User not authorized to delete this report" });
        }
        
        await Report.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Report deleted" });
    } catch (error) {
        console.error("Error in deleting report:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get reports by location (nearby)
export const getNearbyReports = async (req, res) => {
    try {
        const { lat, lng, radius = 1000 } = req.query; // radius in meters

        if (!lat || !lng) {
            return res.status(400).json({ 
                success: false, 
                message: "Latitude and longitude are required" 
            });
        }

        // Make sure coordinates are valid numbers
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid latitude or longitude values" 
            });
        }

        const reports = await Report.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        })
        .populate('user', 'username')
        .sort({ createdAt: -1 });

        // Additional validation to ensure coordinates are valid
        const validReports = reports.filter(report => 
            report.location && 
            report.location.coordinates && 
            Array.isArray(report.location.coordinates) && 
            report.location.coordinates.length === 2 &&
            !isNaN(report.location.coordinates[0]) && 
            !isNaN(report.location.coordinates[1])
        );
        
        if (validReports.length < reports.length) {
            console.log(`Filtered out ${reports.length - validReports.length} nearby reports with invalid location data`);
        }

        res.status(200).json({ success: true, data: validReports });
    } catch (error) {
        console.error("Error in fetching nearby reports:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get user's reports
export const getUserReports = async (req, res) => {
    try {
        // Only return reports with valid location data
        const reports = await Report.find({ 
            user: req.user.id,
            location: { $exists: true },
            'location.coordinates': { $exists: true, $type: 'array', $ne: [] }
        })
        .sort({ createdAt: -1 });
        
        // Additional validation to ensure coordinates are valid
        const validReports = reports.filter(report => 
            report.location && 
            report.location.coordinates && 
            Array.isArray(report.location.coordinates) && 
            report.location.coordinates.length === 2 &&
            !isNaN(report.location.coordinates[0]) && 
            !isNaN(report.location.coordinates[1])
        );
        
        if (validReports.length < reports.length) {
            console.log(`Filtered out ${reports.length - validReports.length} user reports with invalid location data`);
        }
        
        res.status(200).json({ success: true, data: validReports });
    } catch (error) {
        console.error("Error in fetching user reports:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};