const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  getAllBookings,
  getMyBookings,
  createBooking,
  cancelBooking,
} = require("../controllers/bookingController");

// NOTE: mounted at app.use("/api", bookingRoutes) in server.js so that
// the original URL shapes are preserved exactly:
//   GET    /api/bookings
//   POST   /api/bookings
//   PATCH  /api/bookings/:id/cancel
//   GET    /api/my-bookings   (sibling path, not nested under /bookings)

router.get("/bookings", getAllBookings);
router.post("/bookings", authenticateToken, createBooking);
router.patch("/bookings/:id/cancel", authenticateToken, cancelBooking);
router.get("/my-bookings", authenticateToken, getMyBookings);

module.exports = router;
