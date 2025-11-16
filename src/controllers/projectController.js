import Project from '../models/Project.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from "cloudinary";
import { UserSubscription } from '../models/SubscriptionPlan.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).array('projectImages', 5); // Allow up to 5 images

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
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

export const createProject = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Error during file upload", error: err.message });
    }

    try {
      const { title, description, category, budget, location, deadline, postedBy } = req.body;
      const user = await User.findById(postedBy);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.userType !== 'individual') {
        return res.status(403).json({ message: 'Only users with userType "individual" can create projects' });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        imageUrls = await Promise.all(uploadPromises);
      }

      const newProject = new Project({
        title,
        description,
        category,
        budget,
        location,
        deadline,
        postedBy,
        images: imageUrls
      });

      await newProject.save();
      res.status(201).json(newProject);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating project', error: error.message });
    }
  });
};

export const getProjects = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    // Decode the token to get userId (craftsmanId)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const craftsmanId = decoded.userId; 

    const projects = await Project.find({ status: 'open' })
      .sort({ postDate: -1 })
      .populate({
        path: 'postedBy', // The field in Project schema referencing the User
        select: 'profilePicture firstName lastName', // Include only the needed fields
      });

    const projectsWithAppliedStatus = projects.map(project => {
      const alreadyApplied = project.applicants.some(applicant =>
        applicant.craftsmanId.toString() === craftsmanId // Check if craftsmanId exists in the applicants array
      );

      return {
        ...project.toObject(),
        alreadyApplied, // Add the alreadyApplied field to the project
      };
    });

    res.status(200).json(projectsWithAppliedStatus);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};
// export const getProjects = async (req, res) => {
//   try {
//     const projects = await Project.find({ status: 'open' })
//       .sort({ postDate: -1 })
//       .populate({
//         path: 'postedBy', // The field in Project schema referencing the User
//         select: 'profilePicture firstName lastName', // Include only the needed fields
//       });

//     res.status(200).json(projects);
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     res.status(500).json({ message: "Error fetching projects" });
//   }
// };

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    console.log(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project" });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log(userId);
    const userProjects = await Project.find({ postedBy: userId }).sort({ postDate: -1 });

    // If no projects are found
    if (!userProjects || userProjects.length === 0) {
      return res.status(404).json({ message: "No projects found for this user" });
    }

    res.status(200).json(userProjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's projects" });
  }
};

export const getProjectApplicants = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate({
      path: "applicants.craftsmanId",
      select: "firstName lastName", // Fetch only firstName and lastName
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Map applicants to include only fullName and other required fields
    const applicantsWithFullName = project.applicants.map((applicant) => ({
      _id: applicant._id,
      craftsmanId: applicant.craftsmanId?._id || null,
      fullName: applicant.craftsmanId
        ? `${applicant.craftsmanId.firstName} ${applicant.craftsmanId.lastName}`
        : "Unknown",
      proposal: applicant.proposal,
      status: applicant.status,
      applicationDate: applicant.applicationDate,
    }));

    res.status(200).json(applicantsWithFullName);
  } catch (error) {
    console.error("Error fetching project applicants:", error);
    res.status(500).json({ message: "Error fetching project applicants" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, status },
      { new: true }
    );
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "Error updating project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    //only open projects can be deleted
    if (project.status !== 'open') {
      return res.status(403).json({ message: "Only open projects can be deleted" });
    }
    project.isDeleted = true;
    await project.save();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
};

export const assignProjectToCraftsman = async (req, res) => {
  try {
    const { projectId, craftsmanId } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the craftsman has applied to the project
    const applicant = project.applicants.find(applicant => 
      applicant.craftsmanId.toString() === craftsmanId
    );
    if (!applicant) {
      return res.status(400).json({ message: "This craftsman has not applied to the project" });
    }

    // Update project status and assign to craftsman
    project.status = 'in-progress';
    project.assignedTo = craftsmanId;
    applicant.status = 'accepted';

    // Update other applicants' status to 'rejected'
    project.applicants.forEach(applicant => {
      if (applicant.craftsmanId.toString() !== craftsmanId) {
        applicant.status = 'rejected';
      }
    });

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error assigning project to craftsman" });
  }
};

export const completeProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the project is in-progress
    if (project.status !== 'in-progress') {
      return res.status(400).json({ message: "Only in-progress projects can be marked as completed" });
    }

    // Update project status
    project.status = 'completed';
    project.completionDate = new Date();

    // Find the assigned craftsman's active subscription
    if (project.assignedTo) {
      const activeSubscription = await UserSubscription.findOne({
        userId: project.assignedTo,
        isActive: true
      }).sort({ startDate: -1 });

      if (activeSubscription) {
        // Decrease contactsUsed if it's greater than 0
        if (activeSubscription.contactsUsed > 0) {
          activeSubscription.contactsUsed -= 1;
          await activeSubscription.save();
        }
      }
    }

    // Save the updated project
    await project.save();

    res.status(200).json({
      message: "Project completed successfully",
      project
    });
  } catch (error) {
    console.error('Error completing project:', error);
    res.status(500).json({ message: "Error completing project" });
  }
};

// export const applyToProject = async (req, res) => {
//   try {
//     const { craftsmanId, proposal } = req.body;
//     const project = await Project.findById(req.params.id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }
//     project.applicants.push({ craftsmanId, proposal });
//     await project.save();
//     res.status(200).json(project);
//   } catch (error) {
//     res.status(500).json({ message: "Error applying to project" });
//   }
// };


//craftsman functions

export const checkAlreadyApplied = async (req, res) => {
  try {
    const { craftsmanId, projectId } = req.body; // Use body instead of params

    if (!craftsmanId || !projectId) {
      return res.status(400).json({ message: "Craftsman ID and Project ID are required" });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const alreadyApplied = project.applicants.some(applicant => 
      applicant.craftsmanId.toString() === craftsmanId
    );

    res.status(200).json({ alreadyApplied });
  } catch (error) {
    console.error('Error in checkAlreadyApplied:', error);
    res.status(500).json({ message: "Error checking if craftsman has already applied", error: error.message });
  }
};

export const checkCanApply = async (req, res) => {
  //check on teh craftsman's subscription plan and the number of contacts used
  //if the contact limit has been reached, the craftsman cannot apply
  //if the contact limit has not been reached, the craftsman can apply
  //code
  try {
    const { craftsmanId } = req.body;
    const craftsman = await User.findById(craftsmanId);
    if (!craftsman || craftsman.userType !== 'craftsman') {
      return res.status(403).json({ message: "Only craftsmen can apply to projects" });
    }
    const activeSubscription = await UserSubscription.findOne({
      userId: craftsmanId,
      isActive: true
    }).sort({ startDate: -1 });
    if (!activeSubscription) {
      return res.status(403).json({ message: "No active subscription found" });
    }
    let contactLimit;
    switch (activeSubscription.planName) {
      case 'BASIC':
        contactLimit = 1;
        break;
      case 'PRO':
        contactLimit = 15;
        break;
      case 'PREMIUM':
        contactLimit = Infinity;
        break;
      default:
        return res.status(500).json({ message: "Invalid subscription plan" });
    }
    if (activeSubscription.contactsUsed >= contactLimit) {
      return res.status(403).json({ message: "Contact limit reached for your current plan" });
    }
    res.status(200).json({ message: "You can apply to this project", contactsRemaining: contactLimit - activeSubscription.contactsUsed });
  }
  catch (error) {
    console.error('Error checking if craftsman can apply:', error);
    res.status(500).json({ message: "Error checking if craftsman can apply" });
  }

};

export const applyToProject = async (req, res) => {
  try {
    const { craftsmanId, proposal } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the user is a craftsman
    const craftsman = await User.findById(craftsmanId);
    if (!craftsman || craftsman.userType !== 'craftsman') {
      return res.status(403).json({ message: "Only craftsmen can apply to projects" });
    }

    // Check if the craftsman has already applied
    const alreadyApplied = project.applicants.some(applicant => 
      applicant.craftsmanId.toString() === craftsmanId
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied to this project" });
    }

    // Fetch the user's active subscription
    const activeSubscription = await UserSubscription.findOne({
      userId: craftsmanId,
      isActive: true
    }).sort({ startDate: -1 });

    if (!activeSubscription) {
      return res.status(403).json({ message: "No active subscription found" });
    }

    // Check contact limit based on subscription plan
    let contactLimit;
    switch (activeSubscription.planName) {
      case 'BASIC':
        contactLimit = 1;
        break;
      case 'PRO':
        contactLimit = 15;
        break;
      case 'PREMIUM':
        contactLimit = Infinity; // Unlimited
        break;
      default:
        return res.status(500).json({ message: "Invalid subscription plan" });
    }

    if (activeSubscription.contactsUsed >= contactLimit) {
      return res.status(403).json({ message: "Contact limit reached for your current plan" });
    }

    // Apply to the project
    project.applicants.push({ craftsmanId, proposal });
    await project.save();

    // Increment the contactsUsed count
    activeSubscription.contactsUsed += 1;
    await activeSubscription.save();

    res.status(200).json({
      message: "Successfully applied to the project",
      project,
      contactsRemaining: contactLimit - activeSubscription.contactsUsed
    });
  } catch (error) {
    console.error('Error applying to project:', error);
    res.status(500).json({ message: "Error applying to project" });
  }
};

export const getCraftsmanAppliedProjects = async (req, res) => {
  try {
    const craftsmanId = req.params.craftsmanId;
    const appliedProjects = await Project.find({
      'applicants.craftsmanId': craftsmanId,
      status: 'open'
    }).sort({ postDate: -1 })
    .populate('postedBy', 'firstName lastName'); 

    if (!appliedProjects || appliedProjects.length === 0) {
      return res.status(404).json({ message: "No applied projects found for this craftsman" });
    }

    res.status(200).json(appliedProjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching craftsman's applied projects" });
  }
};

// New function to get current projects a craftsman is working on
export const getCraftsmanCurrentProjects = async (req, res) => {
  try {
    const craftsmanId = req.params.craftsmanId;
    const currentProjects = await Project.find({
      assignedTo: craftsmanId,
      status: 'in-progress'
    }).sort({ postDate: -1 }).populate('postedBy', 'firstName lastName');

    if (!currentProjects || currentProjects.length === 0) {
      return res.status(404).json({ message: "No current projects found for this craftsman" });
    }

    res.status(200).json(currentProjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching craftsman's current projects" });
  }
};

// New function to get project history (completed projects) for a craftsman
export const getCraftsmanProjectHistory = async (req, res) => {
  try {
    const craftsmanId = req.params.craftsmanId;
    const completedProjects = await Project.find({
      assignedTo: craftsmanId,
      status: 'completed'
    }).sort({ completionDate: -1 }).populate('postedBy', 'firstName lastName');

    if (!completedProjects || completedProjects.length === 0) {
      return res.status(404).json({ message: "No completed projects found for this craftsman" });
    }

    res.status(200).json(completedProjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching craftsman's project history" });
  }
};


