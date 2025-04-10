import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from './config/db.js';

import reportRoutes from "./routes/report.route.js";
import authRoutes from "./routes/auth.route.js";
import mapsRoutes from "./routes/maps.route.js";

dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS to be permissive in development mode
const corsOptions = {
	origin: function (origin, callback) {
		// Allow any origin in development mode
		callback(null, true);
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
	allowedHeaders: ['Content-Type', 'x-auth-token', 'Accept', 'Authorization'],
	credentials: true,
	preflightContinue: false,
	optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parser middleware with increased size limit
app.use(express.json({
	limit: '10mb',
	// Add more detailed error handling for JSON parsing
	verify: (req, res, buf, encoding) => {
		try {
			JSON.parse(buf);
		} catch (e) {
			res.status(400).json({ success: false, message: 'Invalid JSON' });
			throw new Error('Invalid JSON');
		}
	}
}));

// Logger middleware
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	
	// Add CORS headers manually to be extra safe
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, Authorization');
	res.header('Access-Control-Allow-Credentials', 'true');
	
	// Handle OPTIONS method
	if (req.method === 'OPTIONS') {
		return res.status(204).send();
	}
	
	next();
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/maps", mapsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('../frontend/build'));
	
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
	});
}

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Server error:', err);
	const statusCode = err.statusCode || 500;
	const message = err.message || 'Something went wrong!';
	res.status(statusCode).json({ 
		success: false, 
		message,
		stack: process.env.NODE_ENV === 'production' ? null : err.stack
	});
});

// 404 middleware
app.use((req, res) => {
	res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Handle uncaught exceptions to prevent crashing
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
	console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	connectDB();
	console.log(`Server started at http://localhost:${PORT}`);
});
