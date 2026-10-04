const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

// Create Razorpay payment order
router.post(
  "/create-order",
  authenticateToken,
  createPaymentOrder
);

// Verify successful Razorpay payment
router.post(
  "/verify",
  authenticateToken,
  verifyPayment
);

module.exports = router;