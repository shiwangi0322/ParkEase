const express = require("express");

const router = express.Router();

const {
  getParkingLots,
  getSlots,
  getNearbyParking
} = require("../controllers/parkingController");

router.get("/lots", getParkingLots);

router.get("/slots", getSlots);

router.get("/nearby-parking", getNearbyParking);

module.exports = router;