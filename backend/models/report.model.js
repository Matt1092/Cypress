import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		type: {
			type: String,
			required: true,
			enum: ['infrastructure', 'cleanliness', 'human']
		},
		userLocation: {
			type: String,
			required: true,
		},
		location: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point'
			},
			coordinates: {
				type: [Number],
				required: true
			}
		},
		address: {
			type: String,
			required: true
		},
		status: {
			type: String,
			enum: ['Report Flagged', 'Verified', 'In progress', 'Solved'],
			default: 'Report Flagged'
		},
		verificationCount: {
			type: Number,
			default: 0
		},
		images: [String],
		category: String
	},
	{
		timestamps: true, // createdAt, updatedAt
	}
);

// Create geospatial index
reportSchema.index({ location: '2dsphere' });

const Report = mongoose.model("Report", reportSchema);
export default Report;

