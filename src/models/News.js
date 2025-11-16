import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['news', 'update'], required: true },
}, { timestamps: true });

const News = mongoose.model('News', newsSchema);
export default News;