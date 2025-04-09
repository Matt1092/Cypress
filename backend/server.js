import express from "express";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';

import reportRoutes from "./routes/report.route.js";

dotenv.config();

const app = express();

app.use(express.json()); //allows us to accept JSON data in req.body

app.use("/api/reports", reportRoutes);

app.listen(5000, () => {
	connectDB();
	console.log("Server started at http://localhost:5000 ");
});
