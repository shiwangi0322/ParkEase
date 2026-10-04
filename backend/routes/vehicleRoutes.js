const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  verifyVehicle,
} = require("../controllers/vehicleController");

// Every vehicle route requires a logged-in user
router.use(authenticateToken);

/* Verify vehicle registration number */
router.post("/verify", verifyVehicle);

/* Vehicle CRUD */
router.post("/", createVehicle);

router.get("/", getVehicles);

router.get("/:id", getVehicleById);

router.patch("/:id", updateVehicle);

router.delete("/:id", deleteVehicle);

module.exports = router;