import mongoose from 'mongoose';

const featureRequestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requestBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

const FeatureRequest = mongoose.model('FeatureRequest', featureRequestSchema);
export default FeatureRequest;