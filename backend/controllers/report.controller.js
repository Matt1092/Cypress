import mongoose from "mongoose";
import Report from "../models/report.model.js";

export const getReports = async (req, res) => {
    try {
		const reports = await Report.find({});
		res.status(200).json({ success : true, data: reports });
	} catch (error) {
		console.log("error in fetching reports:", error.message);
		res.status(500).json({ success: false, message:"Server Error" });
	}
}

export const createReport = async (req, res) => {
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
}

export const updateReport = async (req, res) => {
    const { id } = req.params;

	const report = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json( { success: false, message: "Invalid report ID" });
	}

	try {
		const updatedReport = await Report.findByIdAndUpdate(id, report, {new:true});
		res.status(200).json( {success: true, data: updatedReport });
	} catch (error) {
		res.status(500).json( {success: false, message: "Server Error" });
	}
}

export const deleteReport = async (req, res) => {
    const { id } = req.params;

	//if (!reportId) {
//		return res.status(400).json( { success: false, message: "Please provide a report ID" });
//	}

	try {
		await Report.findByIdAndDelete(id);
		res.status(200).json( {success: true, message: "Report deleted" });
	} catch (error) {
		console.log("Error in deleting report:", error.message);
		res.status(404).json( {success: false, message: "Report not found" });
	}
}