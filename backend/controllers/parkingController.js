const pool = require("../db");

// Get all parking lots
const getParkingLots = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        location,
        address,
        total_slots,
        latitude,
        longitude,
        status,
        source
      FROM lots
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching parking lots:", error);
    res.status(500).json({
      message: "Failed to fetch parking lots"
    });
  }
};

// Get all parking slots
const getSlots = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM slots ORDER BY id");

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching slots:", error);

    res.status(500).json({
      message: "Failed to fetch parking slots",
      error: error.message,
    });
  }
};

// Get nearby public parking from Google Places
const getNearbyParking = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required.",
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        message: "Invalid latitude or longitude.",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is missing from .env");

      return res.status(500).json({
        message: "Google Places API key is not configured.",
      });
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.primaryType",
        },

        body: JSON.stringify({
          includedTypes: ["parking"],

          maxResultCount: 20,

          rankPreference: "DISTANCE",

          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: 3000,
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Google Places API error:",
        response.status,
        data
      );

      return res.status(response.status).json({
        message: "Unable to fetch nearby public parking.",
        error: data?.error?.message || "Google Places API error",
      });
    }

    const places = Array.isArray(data.places)
      ? data.places
      : [];

    const parking = places
      .filter(
        (place) =>
          place.location?.latitude != null &&
          place.location?.longitude != null
      )
      .map((place) => ({
        id: place.id,

        name:
          place.displayName?.text ||
          "Public Parking",

        address:
          place.formattedAddress || "",

        latitude:
          place.location.latitude,

        longitude:
          place.location.longitude,

        googleMapsUri:
          place.googleMapsUri || null,

        primaryType:
          place.primaryType || "parking",

        source: "google_places",

        bookable: false,
      }));

    res.json(parking);

  } catch (error) {
    console.error(
      "Error fetching nearby public parking:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch nearby public parking.",
    });
  }
};

module.exports = {
  getParkingLots,
  getSlots,
  getNearbyParking
};