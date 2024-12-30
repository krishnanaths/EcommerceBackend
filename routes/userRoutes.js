const express = require("express");
const {
  updateUserProfile,
  deleteAccount,
  userSearch,
  deleteProfilePhoto,
  getProfile,

} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/profile/:userId", protect, updateUserProfile);
router.post("/deleteacc/:userId", protect, deleteAccount);
router.delete("/profilephoto/delete",protect,deleteProfilePhoto);
router.get("/search", protect, userSearch);
router.get("/profile",protect,getProfile);




module.exports = router;
