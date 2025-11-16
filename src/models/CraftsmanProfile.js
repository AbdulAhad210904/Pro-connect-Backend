import mongoose from "mongoose";

const craftsmanProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skills: String,
    experience: String,
    // portfolio: [{
    //   title: String,
    //   description: String,
    //   imageUrl: String,
    //   projectDate: Date
    // }],
    // certifications: [{
    //   name: String,
    //   issuingAuthority: String,
    //   dateObtained: Date,
    //   expiryDate: Date
    // }],
    ratingAsAProjectWorker: { type: Number, default: 0 },
    ratingAsAnEmployer: { type: Number, default: 0 },
  //   totalReviews: { type: Number, default: 0 },
  //   subscriptionPlan: {
  //     type: { type: String, enum: ["Basis", "Pro", "Premium"] },
  //     startDate: Date,
  //     endDate: Date,
  //   },
  //   privateContactsRemaining: { type: Number, default: 0 },
  // 
  },
  { timestamps: true }
);

const CraftsmanProfile = mongoose.model(
  "CraftsmanProfile",
  craftsmanProfileSchema
);

export default CraftsmanProfile;
