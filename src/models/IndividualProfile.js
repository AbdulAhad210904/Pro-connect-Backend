import mongoose from 'mongoose';

const individualProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectsPosted: { type: Number, default: 0 },
  projectsCompleted: { type: Number, default: 0 }
}, { timestamps: true });

const IndividualProfile = mongoose.model('IndividualProfile', individualProfileSchema);

export default IndividualProfile;