import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["craftsman", "individual"],
      required: true,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true }, // New field
    profilePicture: String,
    phoneNumber: String,
    isDisable: Boolean,
    isDelete: Boolean,
    emailVerificationCode: String,
    emailVerificationExpiry: Date,
    isEmailVerified: { type: Boolean, default: false },
    isPhoneNumberVerified: { type: Boolean, default: false },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        enum: ["Belgium", "Netherlands"],
        required: true,
      },
    },
    companyName: {
      type: String,
      required: function () {
        return this.userType === "craftsman";
      },
    },
    vatOrKvKNumber: {
      type: String,
      required: function () {
        return this.userType === "craftsman";
      },
    },    
    dateJoined: { type: Date, default: Date.now },
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    socialAuth: {
      facebook: { id: String, token: String },
      google: { id: String, token: String },
    },
    settings: {
      notifications: { type: Boolean, default: true },
      privacySettings: mongoose.Schema.Types.Mixed,
    },
    identificationDocument: { type: String, required: true },
    projectInterest: {
      type: [
        {
          type: String,
          enum: ["Gardening", "Home Renovation", "Electrical", "Others"],
        },
      ],
      required: function () {
        return this.userType === "individual";
      },
    },
    otherProjectInterest: {
      type: String,
      required: function () {
        return (
          this.userType === "individual" &&
          this.projectInterest.includes("Others")
        );
      },
    },
    professionalCertificates: {
      type: [String],
      required: function () {
        return this.userType === "craftsman";
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;