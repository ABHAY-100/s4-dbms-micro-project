const express = require("express");
const userAuth = require("../middleware/userAuth.cjs");
const adminAuth = require("../middleware/adminAuth.cjs");
const {
  register,
  login,
  logout,
  getProfile,
  updateUser,
  getAllStaff,
  updateUserStatus,
} = require("../controllers/userController.cjs");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", userAuth, logout);
router.get("/profile", userAuth, getProfile);
router.patch("/update", userAuth, updateUser);

router.get("/staff", userAuth, adminAuth, getAllStaff);
router.put("/staff/status", userAuth, adminAuth, updateUserStatus);

module.exports = router;
