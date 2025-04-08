import express from "express";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import Report from './models/report.model.js';

dotenv.config();


const app = express();

app.use(express.json()); //allows us to accept JSON data in req.body

app.post("/api/reports", async (req,res) => {
	const report = req.body; //User will send this data

	if (!report.name || !report.description || !report.userLocation) {
		return res.status(400).json( { success: false, message: "Please provide all fields" });
	}

	const newReport = new Report(report);

	try {
		await newReport.save();
		res.status(201).json( {success: true, data: newReport });
	} catch (error) {
		console.error("Error in create report:", error.message);
		res.status(500).json( {success: false, message: "Server Error" });
	}
});

// Postman desktop app

app.listen(5000, () => {
	connectDB();
	console.log("Server started at http://localhost:5000 ");
});
