import CraftsmanProfile from "../models/CraftsmanProfile.js";
import User from "../models/User.js"
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer middleware setup
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'profilePicture', maxCount: 1 }
]);

export const createProfile = async (req, res) => {
  try {
    const { skills, experience, ratingAsAProjectWorker, ratingAsAnEmployer } =
      req.body;
    const userId = req.userId;
    const newProfile = new CraftsmanProfile({
      userId,
      skills,
      experience,
      ratingAsAProjectWorker,
      ratingAsAnEmployer,
    });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    res.status(500).json({ message: "Error creating profile" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    let profile = await CraftsmanProfile.findOne({
      userId: userId,
    }).populate({
      path: "userId",
      select: "email firstName lastName profilePicture phoneNumber address", // Fields to retrieve
    });
    if (!profile) {
      // return res.status(302).json({ message: "Profile not found" });
      const newProfile = new CraftsmanProfile({
        userId,
        "skills":"",
        "experience":""  
      });
      await newProfile.save();
      profile = await CraftsmanProfile.findOne({
        userId: userId,
      }).populate({
        path: "userId",
      select: "email firstName lastName profilePicture phoneNumber address", // Fields to retrieve
    });
    if (!profile) {
       return res.status(302).json({ message: "Profile not found" });
      }
    }

    res.status(200).json(profile);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try { upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Error during file upload", error: err.message });
    }

    const userId = req.userId; // Assuming userId is extracted from a middleware/authentication logic
    const {
      address,
      phoneNumber,
      firstName,
      lastName,
      skills,
      experience,
      ratingAsAProjectWorker,
      ratingAsAnEmployer,
    } = req.body;


    const uploadToCloudinary = (fileBuffer, isRaw = false) => {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          resource_type: isRaw ? "raw" : "image", // "raw" for non-image files
        };
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        });
        uploadStream.end(fileBuffer);
      });
    };

    // Handle file upload to Cloudinary if profilePicture is included
    let profilePictureUrl = null;
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture[0]; // Get the uploaded profile picture file
      const uploadResponse = await uploadToCloudinary(file.buffer);
      profilePictureUrl = uploadResponse;
    }
    // Construct the update object for `userId` (users collection)
    const userUpdateFields = {};
    if (address) userUpdateFields.address = address;
    if (phoneNumber) userUpdateFields.phoneNumber = phoneNumber;
    if (firstName) userUpdateFields.firstName = firstName;
    if (lastName) userUpdateFields.lastName = lastName;
    if (profilePictureUrl) userUpdateFields.profilePicture = profilePictureUrl;

    // Update the User document
    let token = null;
    let updatedUser = null;
    if (Object.keys(userUpdateFields).length > 0) {
      updatedUser = await User.findByIdAndUpdate(userId, userUpdateFields, {
        new: true,
      }).select("email firstName lastName profilePicture phoneNumber address userType");
       token = jwt.sign(
        { 
          userId: userId, 
          firstName: updatedUser.firstName, 
          userType: updatedUser.userType,
          profilePicture: updatedUser.profilePicture
        },
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );
    }

    // Update the CraftsmanProfile document
    const profileUpdateFields = {
      ...(skills && { skills }),
      ...(experience && { experience }),
      ...(ratingAsAProjectWorker && { ratingAsAProjectWorker }),
      ...(ratingAsAnEmployer && { ratingAsAnEmployer }),
    };

    let updatedProfile = await CraftsmanProfile.findOneAndUpdate(
      { userId: userId },
      profileUpdateFields,
      { new: true }
    );
 
    // Combine updated data into a unified response format
    const response = {
      userId: {
        firstName: updatedUser?.firstName || "",
        lastName: updatedUser?.lastName || "",
        email: updatedUser?.email || "",
        address: {
          street: updatedUser?.address?.street || "",
          city: updatedUser?.address?.city || "",
          state: updatedUser?.address?.state || "",
          zipCode: updatedUser?.address?.zipCode || "",
          country: updatedUser?.address?.country || "",
        },
        phoneNumber: updatedUser?.phoneNumber || "",
        profilePicture: updatedUser?.profilePicture || "",
      },
      skills: updatedProfile?.skills || "",
      experience: updatedProfile?.experience || "",
      ratingAsAProjectWorker: updatedProfile?.ratingAsAProjectWorker || "",
      ratingAsAnEmployer: updatedProfile?.ratingAsAnEmployer || "",
    };
    if(token){
      res.status(200).json({response,token});
    }
    else{
    res.status(200).json(response);
    }
  });} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile" });
  }
};