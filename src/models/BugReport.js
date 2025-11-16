import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
    description: { type: String, required: true },
    additionalInfo: { type: String, required: true },
    bugScreenshots: [{ type: String }],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const BugReport = mongoose.model('BugReport', bugReportSchema);

export default BugReport;