import IndividualProfile from '../models/IndividualProfile.js';

export const createProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const newProfile = new IndividualProfile({ userId });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (error) {
    res.status(500).json({ message: "Error creating profile" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await IndividualProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updatedProfile = await IndividualProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { $inc: { projectsPosted: 1 } },
      { new: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};