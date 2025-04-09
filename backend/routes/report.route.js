import express from "express";
//import mongoose from "mongoose";

//import Report from "../models/report.model.js";
import { createReport, deleteReport, getReports, updateReport } from '../controllers/report.controller.js';

const router = express.Router();

router.get("/", getReports);

router.post("/", createReport);

router.put("/:id", updateReport);

router.delete("/:id", deleteReport);

export default router;

