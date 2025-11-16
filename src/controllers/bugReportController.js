import BugReport from '../models/BugReport.js';
import User from '../models/User.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// Set up multer to handle image files
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('bugScreenshots', 5); // Allow up to 5 images

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Create Bug Report
export const createBugReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error during file upload', error: err.message });
    }

    try {
      const { description, additionalInfo } = req.body;
       const reportedBy = req.userId;
      // Validate if the user exists
      const user = await User.findById(reportedBy);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        imageUrls = await Promise.all(uploadPromises);
      }

      const newBugReport = new BugReport({
        description,
        additionalInfo,
        reportedBy,
        bugScreenshots: imageUrls,
      });

      await newBugReport.save();
      res.status(201).json(newBugReport);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating bug report', error: error.message });
    }
  });
};

// Get All Bug Reports
export const getAllBugReports = async (req, res) => {
  try {
    const bugReports = await BugReport.find()
      .populate('reportedBy', 'firstName lastName email') // Populate user info
      .sort({ createdAt: -1 }); // Sort by latest report first

    res.status(200).json(bugReports);
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ message: 'Error fetching bug reports' });
  }
};
