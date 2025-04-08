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
		userLocation: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true, // createdAt, updatedAt
	}
);

const Report = mongoose.model("Report", reportSchema);
export default Report;

