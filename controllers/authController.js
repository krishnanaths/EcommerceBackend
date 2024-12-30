const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5000000 },
//   fileFilter: function (req, file, cb) {
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb("Error: Images only!");
//     }
//   },
// }).single("profileImage");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // App password (NOT your Gmail password)
  },
});

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;



  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
    isVerified: false,
    verificationToken,
  });

  if (user) {
    const verificationLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;

    const message = {
      from: `krisnanath.zedsoft@gmail.com`, // Replace with your Gmail address
      to: user.email,
      subject: "Email Verification",
      text: `Please verify your email by clicking on the following link: ${verificationLink}`,
      html: `<p>Please verify your email by clicking on the following link: <a href="${verificationLink}">Verify Email</a></p>`,
    };

    try {
      await transporter.sendMail(message);
      res.status(201).json({
        message: "User registered. Please verify your email to log in.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send verification email." });
    }
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  console.log('Received token:', token);  // Log the token from the URL

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    console.log('No user found with this token'); // Log if user is not found
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  console.log('User found:', user);  // Log the user object to check

  user.isVerified = true;
  user.verificationToken = null; // Clear the token after verification
  await user.save();

  res.json({ message: "Email verified successfully. You can now log in." });
};


const loginUser = async (req, res) => {
  console.log(req.body); // Log the request body to check what's being sent
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Please provide both username and password.' });
  }

  try {
    // Check if the provided name is an email or username
    const user = await User.findOne({
      $or: [
        { name: name.toLowerCase() }, // Check for username
        { email: name.toLowerCase() }, // Check for email
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    // Check if the password matches
    if (await user.matchPassword(password)) {
      const token = generateToken(user._id); // Generate JWT token

      // Send response with user data and token
      return res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return res.status(401).json({ message: "Invalid username/email or password" });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// const loginUser = async (req, res) => {
//   console.log(req.body); // Log the request body to check what's being sent
//   const { name, password } = req.body;
  
//   if (!name || !password) {
//     return res.status(400).json({ message: 'Please provide both username and password.' });
//   }

//   try {
    
//       // Check if user exists based on either email or name
//       const user = await User.findOne({
//         $or: [
//           { name: name.toLowerCase() },
//         ],
//       });
  
//       if (!user) {
//         return res
//           .status(401)
//           .json({ message: "Invalid email/username or password" });
//       }
  
//       // Check if the user is verified
//       if (!user.isVerified) {
//         return res
//           .status(403)
//           .json({ message: "Please verify your email before logging in" });
//       }
  
//       // Check if the password matches
//       if (await user.matchPassword(password)) {
//         res.json({
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           token: generateToken(user._id),
//         });
//       } else {
//         res.status(401).json({ message: "Invalid email/username or password" });
//       }
//   } catch (error) {
//     console.error("Error logging in user:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };






const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = generateToken(user._id);
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  // const resetUrl = `API/auth/passwordreset/${resetToken}`;
  const resetUrl = `api/auth/passwordreset/${resetToken}`;

  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
  `;

  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.SMTP_HOST,
      // port: process.env.SMTP_PORT,
      // auth: {
      //   user: process.env.SMTP_USER,
      //   pass: process.env.SMTP_PASS,
      // },
      host: "localhost",
      port: 1025,
      secure: false,
    });

    const mailOptions = {
      from: "nath93266@gmail.com",
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(500).json({ message: "Email could not be sent" });
  }
};

const resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

    // user.password = hashedPassword;
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
 registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
};
