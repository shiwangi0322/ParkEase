require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// HOME
// =====================================================
app.get("/", (req, res) => {
  res.json({
    message: "ParkEase backend is running 🚗",
  });
});

// =====================================================
// DATABASE TEST
// =====================================================
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// =====================================================
// ROUTES
// =====================================================
app.use("/api/auth", authRoutes);
app.use("/api", parkingRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api", bookingRoutes);
app.use("/api/payment", paymentRoutes);

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`ParkEase server running on http://localhost:${PORT}`);
});