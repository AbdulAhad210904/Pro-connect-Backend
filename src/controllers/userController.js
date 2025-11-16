import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import nodemailer from "nodemailer";
import { UAParser } from "ua-parser-js";
import twilio from "twilio";
import {UserSubscription} from "../models/SubscriptionPlan.js";

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const authVerification = process.env.AUTH_VERIFICATION;
const client = twilio(accountSid, authToken);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer middleware setup
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "identificationDocument", maxCount: 1 },
  { name: "professionalCertificates", maxCount: 5 },
]);

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const register = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Error during file upload", error: err.message });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        dateOfBirth, // New field
        userType,
        projectInterest,
        otherProjectInterest,
        phoneNumber,
        address,
        companyName,
        vatOrKvKNumber,
      } = req.body;

      console.log(req.body);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth, // New field
        userType,
      });

      const uploadToCloudinary = (fileBuffer, isRaw = false) => {
        return new Promise((resolve, reject) => {
          const uploadOptions = {
            resource_type: isRaw ? "raw" : "image",
          };
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
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

      if (req.files?.profilePicture?.[0]) {
        newUser.profilePicture = await uploadToCloudinary(
          req.files.profilePicture[0].buffer
        );
      }

      if (req.files?.identificationDocument?.[0]) {
        newUser.identificationDocument = await uploadToCloudinary(
          req.files.identificationDocument[0].buffer,
          true
        );
      }

      if (userType === "craftsman") {
        if (!vatOrKvKNumber) {
          return res.status(400).json({
            message: "VAT or KVK Number is required for craftsmen.",
          });
        }
      
        if (!companyName) {
          // Check if the same company name exists
          const existingCompany = await User.findOne({ companyName });
          if (existingCompany) {
            return res.status(400).json({ message: "Company already exists" });
          }
          return res.status(400).json({
            message: "Company Name is required for craftsmen.",
          });
        }
      
        newUser.companyName = companyName;
      
        // Check for professional certificates only if they exist
        if (req.files?.professionalCertificates) {
          const certificateUploads = req.files.professionalCertificates.map(
            async (file) => uploadToCloudinary(file.buffer, true)
          );
          newUser.professionalCertificates = await Promise.all(certificateUploads);
        }
      }
      

      if (userType === "individual") {
        // Parse the projectInterest JSON string back into an array
        newUser.projectInterest = JSON.parse(projectInterest) || [];
        if (newUser.projectInterest.includes("Others") && otherProjectInterest) {
          newUser.otherProjectInterest = otherProjectInterest;
        }
      }

      if (phoneNumber) {
        newUser.phoneNumber = phoneNumber;
      }
      if (address) {
        try {
          const parsedAddress = JSON.parse(address);
          newUser.address = parsedAddress;

          if (parsedAddress.country === "Belgium" && userType === "craftsman") {
            if (!/^BE\d{10}$/.test(vatOrKvKNumber)) {
              return res.status(400).json({
                message: "VAT Number must follow the format: BE0123456789.",
              });
            }
          } else if (parsedAddress.country === "Netherlands" && userType === "craftsman") {
            if (!/^\d{8}$/.test(vatOrKvKNumber)) {
              return res.status(400).json({
                message:
                  "Chamber of Commerce Number (KVK) must be 8 digits.",
              });
            }
          }
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid address format", error: err.message });
        }
      }
      if (vatOrKvKNumber) {
        newUser.vatOrKvKNumber = vatOrKvKNumber;
      }

      await newUser.save();
      
    const basicSubscription = new UserSubscription({
      userId: newUser._id,
      planName: 'BASIC',
      billingCycle: 'free',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isActive: true,
      autoRenew: false
    });
    await basicSubscription.save();

      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({ result: newUser, token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }
    if(existingUser.isDelete)
      {
        return res.status(404).json({ message: "Account not exist" });
      }
  
    if(existingUser.isDisable)
    {
      return res.status(404).json({ message: "Account Disabled\nContact: orbit@gmail.com" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Initialize subscriptionDetails as null
    let subscriptionDetails = null;

    // Fetch the user's active subscription only if userType is "craftsman"
    if (existingUser.userType === "craftsman") {
      const activeSubscription = await UserSubscription.findOne({
        userId: existingUser._id,
        isActive: true
      }).sort({ startDate: -1 });

      // Prepare subscription details for the token
      if (activeSubscription) {
        subscriptionDetails = {
          planName: activeSubscription.planName,
          billingCycle: activeSubscription.billingCycle,
          endDate: activeSubscription.endDate,
          privateContactsLimit:
            activeSubscription.planName === "BASIC"
              ? 1
              : activeSubscription.planName === "PRO"
              ? 15
              : -1, // -1 for unlimited (PREMIUM)
          contactsUsed: activeSubscription.contactsUsed,
        };
      }
    }

    // Create the token
    const tokenPayload = {
      userId: existingUser._id,
      firstName: existingUser.firstName,
      userType: existingUser.userType,
      profilePicture: existingUser.profilePicture,
    };

    // Add subscription to the token only if userType is "craftsman"
    if (subscriptionDetails) {
      tokenPayload.subscription = subscriptionDetails;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });
    const userId = existingUser._id;
    const userAgent = req.headers["user-agent"];

    const parser = new UAParser(userAgent);
    const deviceName = parser.getDevice().model || "Unknown Device";
    const browser = parser.getBrowser().name || "Unknown Browser";

    await Session.create({
      userId,
      deviceName,
      browser,
    });

    res.status(200).json({ result: existingUser, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const updateTokenAfterPayment = async (req, res) => {
  try {
    const userId = req.userId; // Assuming `req.userId` is populated via authentication middleware.

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's subscription in the database
    const subscription = await UserSubscription.findOne({ userId })
    .sort({ startDate: -1 }) // Ensure the most recent subscription is retrieved
    .exec();

    if (!subscription) {
      return res.status(404).json({ message: "Active subscription not found" });
    }

    // Create new token payload with updated subscription details
    const tokenPayload = {
      userId: user._id,
      firstName: user.firstName,
      userType: user.userType,
      profilePicture: user.profilePicture,
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        endDate: subscription.endDate,
        privateContactsLimit:
          subscription.planName === "BASIC"
            ? 1
            : subscription.planName === "PRO"
            ? 15
            : -1, // -1 for unlimited (PREMIUM)
        contactsUsed: subscription.contactsUsed,
      },
    };
    console.log(tokenPayload);
    // Generate a new token
    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ token: newToken, message: "Token updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phoneNumber, address },
      { new: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the current password matches
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "Current password is not correct" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateDisableStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isDisable = true;
    await user.save();

    res.status(200).json({
      message: `User Disabled successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateDeleteStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDelete = true;
    await user.save();

    res.status(200).json({
      message: `User Deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Email Verification Controllers
export const sendEmailVerificationCode = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiry = expiryTime;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    });

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};
export const sendPasswordUpdateVerificationCodeToEmail = async (req, res) => {
  const { email } = req.body;
  console.log("xxxx");
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiry = expiryTime;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    });

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};
export const updatePasswordWithCode = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
console.log(req.body)
    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ message: "Email, verification code, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the verification code matches and is not expired
    if (
      user.emailVerificationCode !== verificationCode ||
      user.emailVerificationExpiry < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password and clear the verification code fields
    user.password = hashedNewPassword;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyEmailVerificationCode = async (req, res) => {
  const {  code } = req.body;

  if ( !code) {
    return res.status(400).json({ message: "Verification code are required" });
  }

  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user.emailVerificationCode === code &&
      user.emailVerificationExpiry > new Date()
    ) {
      user.isEmailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationExpiry = null;
      await user.save();

      res.status(200).json({ message: "Email verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid or expired verification code" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const sendPhoneVerificationCode = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    await client.verify.v2
      .services(authVerification)
      .verifications.create({ to: phoneNumber, channel: "sms" });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Verify OTP
export const verifyPhoneVerificationCode = async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;

  if (!phoneNumber || !verificationCode) {
    return res.status(400).json({ message: "Phone number and verification code are required." });
  }

  try {
    // Check OTP verification with Twilio
    const verificationCheck = await client.verify.v2
      .services(authVerification)
      .verificationChecks.create({ to: phoneNumber, code: verificationCode });

    if (verificationCheck.status === "approved") {
      // Find user in the database
      const userId = req.userId; // Assuming `req.userId` is populated by authentication middleware
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Update user's phone verification status
      user.isPhoneNumberVerified = true;
      await user.save(); // Save changes to the database

      return res.status(200).json({ message: "OTP verified successfully." });
    } else {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);

    if (error.code === 20404) { // Twilio-specific error code for "verification not found"
      return res.status(400).json({ message: "Invalid OTP or expired verification session." });
    }

    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};

export const checkPhoneVerificationStatus = async (req,res) => {
  try {
    const userId = req.userId; 
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found.");
    }
    if( user.isPhoneNumberVerified)
    {
      res.status(200).json({
        message: "Phone is verified",
      });
    }
    else {
      res.status(200).json({ message: "Phone is not verified" });
    }
  } catch (error) {
    console.error("Error in phone verification service:", error);
    throw new Error(error.message || "Error checking phone verification status.");
  }
};

export const checkEmailVerificationStatus = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user.isEmailVerified);
    if (user.isEmailVerified === true) {
      res.status(200).json({
        message: "Email is verified",
      });
    } else {
      res.status(200).json({ message: "Email is not verified" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};
