const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images only!");
    }
  },
}).single("postImage");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};


const updateUserProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
     
      console.error("Multer error:", err);
      return res.status(400).json({ message: "Error uploading file", error: err });
    }

    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

    
      user.name = req.body.name ?? user.name;
      user.mobile = req.body.mobile ?? user.mobile;
      user.email = req.body.email ?? user.email;
      
     
      if (req.file) {
        user.photo = req.file.path;
      }

      user.state = req.body.state ?? user.state;
      user.job = req.body.job ?? user.job;
      user.district = req.body.district ?? user.district;
      user.office = req.body.office ?? user.office;
      user.officePlace = req.body.officePlace ?? user.officePlace;

      const updatedUser = await user.save();

      return res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        photo: updatedUser.photo, 
        state: updatedUser.state,
        job: updatedUser.job,
        district: updatedUser.district,
        office: updatedUser.office,
        officePlace: updatedUser.officePlace,
        role: updatedUser.role,
        token: generateToken(updatedUser._id), // Ensure this function is secure
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile", error });
    }
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name') // Optional: to include followers' names
      .populate('following', 'name'); // Optional: to include following users' names

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      photo: user.photo,
      state: user.state,
      job: user.job,
      district: user.district,
      office: user.office,
      officePlace: user.officePlace,
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const userSearch = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { job: { $regex: query, $options: "i" } },
        { officePlace: { $regex: query, $options: "i" } },
        { district: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
      ],
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.photo = ""; 
    await user.save();

    res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



module.exports = {
  updateUserProfile,
  deleteAccount,
  userSearch,
  getProfile,
  deleteProfilePhoto
};
