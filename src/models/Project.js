import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: String,
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  postDate: { type: Date, default: Date.now },
  deadline: Date,
  status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{
    craftsmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applicationDate: { type: Date, default: Date.now },
    proposal: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completionDate: Date,
  isDeleted: { type: Boolean, default: false },
  images: [{ type: String }]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;