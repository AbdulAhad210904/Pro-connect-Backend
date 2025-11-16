import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deviceName: { type: String, required: true },
  browser: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
