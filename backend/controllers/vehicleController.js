const pool = require("../db");

const VALID_TYPES = [
  "car",
  "bike",
  "scooter",
  "auto",
];

// Supports:
// MH01AB1234
// MH12A1234
// DL01AB1234
// 22BH1234AA
const VEHICLE_NUMBER_REGEX =
  /^(?:[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/;

function normalizeVehicleNumber(value) {
  return String(value)
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

function isValidVehicleNumber(value) {
  return VEHICLE_NUMBER_REGEX.test(value);
}

function parseBoolean(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function getErrorDetails(error) {
  return {
    code: error.code,
    constraint: error.constraint,
    detail: error.detail,
    table: error.table,
    column: error.column,
    message: error.message,
  };
}

// =====================================================
// VERIFY VEHICLE - API SATHI
// =====================================================

async function verifyVehicle(req, res) {
  try {
    let { vehicle_number } = req.body;

    // ---------------------------------------------
    // Required validation
    // ---------------------------------------------

    if (!vehicle_number) {
      return res.status(400).json({
        success: false,
        verified: false,
        verification_status: "unverified",
        message: "Vehicle number is required.",
      });
    }

    // ---------------------------------------------
    // Normalize vehicle number
    // ---------------------------------------------

    vehicle_number = normalizeVehicleNumber(vehicle_number);

    // ---------------------------------------------
    // Vehicle number format validation
    // ---------------------------------------------

    if (!isValidVehicleNumber(vehicle_number)) {
      return res.status(400).json({
        success: false,
        verified: false,
        verification_status: "unverified",
        message:
          "Please enter a valid Indian vehicle registration number.",
      });
    }

    // ---------------------------------------------
    // API SATHI RC VERIFICATION
    // ---------------------------------------------

    const apiKey = process.env.API_SATHI_KEY;

    if (!apiKey) {
      console.error(
        "API_SATHI_KEY is missing in .env"
      );

      return res.status(500).json({
        success: false,
        verified: false,
        verification_status: "unverified",
        message:
          "Vehicle verification API key is not configured.",
      });
    }

    // ---------------------------------------------
    // Log request
    // ---------------------------------------------

    console.log(
      "Checking vehicle with API Sathi:",
      vehicle_number
    );

    // ---------------------------------------------
    // Call API Sathi
    // ---------------------------------------------

    const apiResponse = await fetch(
      "https://apisathi.in/gw/v1/vehicle-rc-v1/",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },

        body: JSON.stringify({
          rc_number: vehicle_number,
        }),
      }
    );

    // ---------------------------------------------
    // Read API response
    // ---------------------------------------------

    let apiData = null;

    try {
      apiData = await apiResponse.json();
    } catch {
      apiData = null;
    }

    // ---------------------------------------------
    // Console logs
    // ---------------------------------------------

    console.log(
      "API SATHI STATUS:",
      apiResponse.status
    );

    console.log(
      "API SATHI RESPONSE:",
      apiData
    );

    // ---------------------------------------------
    // API ERROR
    // ---------------------------------------------

    if (!apiResponse.ok) {
      const apiMessage =
        apiData?.error?.message ||
        apiData?.message ||
        apiData?.error ||
        "Vehicle verification service failed.";

      return res.status(apiResponse.status).json({
        success: false,
        verified: false,
        verification_status: "unverified",
        vehicle_number,
        message: String(apiMessage),
        api_error:
          apiData?.error?.code ||
          apiData?.code ||
          null,
      });
    }

    // ---------------------------------------------
    // Get vehicle data
    // ---------------------------------------------

    const vehicleData =
      apiData?.data || apiData;

    // ---------------------------------------------
    // CHECK VERIFIED STATUS
    // ---------------------------------------------

    const isVerified =
      apiData?.verified === true ||
      apiData?.data?.verified === true ||
      (
        apiData?.success === true &&
        Boolean(
          apiData?.data?.rc_number ||
          apiData?.data?.registration_number ||
          apiData?.data?.vehicle_number
        )
      );

    // ---------------------------------------------
    // VERIFIED
    // ---------------------------------------------

    if (isVerified) {
      return res.status(200).json({
        success: true,

        verified: true,

        verification_status: "verified",

        verification_source: "API Sathi",

        verified_at:
          new Date().toISOString(),

        vehicle_number,

        owner_name:
          vehicleData?.owner_name ||
          vehicleData?.ownerName ||
          null,

        maker_model:
          vehicleData?.maker_model ||
          vehicleData?.makerModel ||
          vehicleData?.maker_and_model ||
          null,

        fuel_type:
          vehicleData?.fuel_type ||
          vehicleData?.fuelType ||
          null,

        vehicle_class:
          vehicleData?.vehicle_class ||
          vehicleData?.vehicleClass ||
          null,

        registration_date:
          vehicleData?.registration_date ||
          vehicleData?.registrationDate ||
          null,

        insurance_upto:
          vehicleData?.insurance_upto ||
          vehicleData?.insuranceUpto ||
          null,

        fitness_upto:
          vehicleData?.fitness_upto ||
          vehicleData?.fitnessUpto ||
          null,

        message:
          "Vehicle RC verified successfully.",
      });
    }

    // ---------------------------------------------
    // NOT VERIFIED / NO RECORD
    // ---------------------------------------------

    return res.status(200).json({
      success: true,

      verified: false,

      verification_status: "unverified",

      verification_source: "API Sathi",

      verified_at: null,

      vehicle_number,

      owner_name:
        vehicleData?.owner_name ||
        vehicleData?.ownerName ||
        null,

      maker_model:
        vehicleData?.maker_model ||
        vehicleData?.makerModel ||
        null,

      message:
        apiData?.message ||
        "Vehicle RC could not be verified.",
    });
  } catch (error) {
    // ---------------------------------------------
    // Verification error
    // ---------------------------------------------

    console.error(
      "Vehicle verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      verified: false,
      verification_status: "unverified",
      message:
        "Vehicle verification service is currently unavailable.",
    });
  }
}

// =====================================================
// CREATE VEHICLE
// =====================================================

async function createVehicle(req, res) {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const user_id = req.user.id;

    let {
      vehicle_type,
      vehicle_number,
      brand,
      model,
      color,
      is_default,
      verification_status,
      verification_source,
      verified_at,
    } = req.body;

    // ---------------------------------------------
    // Required validation
    // ---------------------------------------------

    if (
      !vehicle_type ||
      !vehicle_number
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle type and vehicle number are required.",
      });
    }

    // ---------------------------------------------
    // Normalize vehicle type
    // ---------------------------------------------

    vehicle_type = String(
      vehicle_type
    )
      .toLowerCase()
      .trim();

    // ---------------------------------------------
    // Validate vehicle type
    // ---------------------------------------------

    if (
      !VALID_TYPES.includes(
        vehicle_type
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Vehicle type must be one of: ${VALID_TYPES.join(
          ", "
        )}.`,
      });
    }

    // ---------------------------------------------
    // Normalize vehicle number
    // ---------------------------------------------

    vehicle_number =
      normalizeVehicleNumber(
        vehicle_number
      );

    // ---------------------------------------------
    // Validate vehicle number
    // ---------------------------------------------

    if (
      !isValidVehicleNumber(
        vehicle_number
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid Indian vehicle registration number, e.g. MH02CD5678.",
      });
    }

    // ---------------------------------------------
    // Verification is OPTIONAL
    // ---------------------------------------------

    verification_status =
      verification_status ===
      "verified"
        ? "verified"
        : "unverified";

    // ---------------------------------------------
    // Do not accept fake verification metadata
    // ---------------------------------------------

    if (
      verification_status !==
      "verified"
    ) {
      verification_source = null;
      verified_at = null;
    } else {
      verification_source =
        verification_source
          ? String(
              verification_source
            ).trim()
          : null;

      verified_at =
        verified_at || null;
    }

    // ---------------------------------------------
    // Optional fields
    // ---------------------------------------------

    brand = brand
      ? String(brand).trim()
      : null;

    model = model
      ? String(model).trim()
      : null;

    color = color
      ? String(color)
          .toLowerCase()
          .trim()
      : null;

    is_default =
      parseBoolean(is_default);

    // ---------------------------------------------
    // Duplicate vehicle number
    // ---------------------------------------------

    const duplicateCheck =
      await client.query(
        `
        SELECT id
        FROM vehicles
        WHERE UPPER(
          REPLACE(vehicle_number, ' ', '')
        ) = $1
        LIMIT 1;
        `,
        [vehicle_number]
      );

    if (
      duplicateCheck.rows.length >
      0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle number is already registered.",
      });
    }

    // ---------------------------------------------
    // Start transaction
    // ---------------------------------------------

    await client.query("BEGIN");

    transactionStarted = true;

    // ---------------------------------------------
    // Remove previous default vehicle
    // ---------------------------------------------

    if (is_default) {
      await client.query(
        `
        UPDATE vehicles
        SET is_default = false
        WHERE user_id = $1
          AND is_default = true;
        `,
        [user_id]
      );
    }

    // ---------------------------------------------
    // Insert vehicle
    // ---------------------------------------------

    const result =
      await client.query(
        `
        INSERT INTO vehicles
        (
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING
          id,
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at,
          created_at;
        `,
        [
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at,
        ]
      );

    // ---------------------------------------------
    // Commit transaction
    // ---------------------------------------------

    await client.query("COMMIT");

    transactionStarted = false;

    // ---------------------------------------------
    // Response
    // ---------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Vehicle added successfully.",

      vehicle:
        result.rows[0],
    });
  } catch (error) {
    // ---------------------------------------------
    // Rollback
    // ---------------------------------------------

    if (transactionStarted) {
      await client.query(
        "ROLLBACK"
      );
    }

    // ---------------------------------------------
    // Error log
    // ---------------------------------------------

    console.error(
      "Error creating vehicle:",
      getErrorDetails(error)
    );

    // ---------------------------------------------
    // Duplicate error
    // ---------------------------------------------

    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle number is already registered.",
      });
    }

    // ---------------------------------------------
    // General error
    // ---------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Failed to add vehicle.",
    });
  } finally {
    client.release();
  }
}

// =====================================================
// GET ALL VEHICLES
// =====================================================

async function getVehicles(req, res) {
  try {
    const user_id =
      req.user.id;

    const result =
      await pool.query(
        `
        SELECT
          id,
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at,
          created_at
        FROM vehicles
        WHERE user_id = $1
        ORDER BY
          is_default DESC,
          created_at DESC;
        `,
        [user_id]
      );

    return res.json({
      success: true,
      vehicles:
        result.rows,
    });
  } catch (error) {
    console.error(
      "Error fetching vehicles:",
      getErrorDetails(error)
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch vehicles.",
    });
  }
}

// =====================================================
// GET SINGLE VEHICLE
// =====================================================

async function getVehicleById(
  req,
  res
) {
  try {
    const user_id =
      req.user.id;

    const { id } =
      req.params;

    const result =
      await pool.query(
        `
        SELECT
          id,
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at,
          created_at
        FROM vehicles
        WHERE id = $1
          AND user_id = $2;
        `,
        [id, user_id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found.",
      });
    }

    return res.json({
      success: true,
      vehicle:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error fetching vehicle:",
      getErrorDetails(error)
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch vehicle.",
    });
  }
}

// =====================================================
// UPDATE VEHICLE
// =====================================================

async function updateVehicle(
  req,
  res
) {
  const client =
    await pool.connect();

  let transactionStarted =
    false;

  try {
    const user_id =
      req.user.id;

    const { id } =
      req.params;

    let {
      vehicle_type,
      vehicle_number,
      brand,
      model,
      color,
      is_default,
      verification_status,
      verification_source,
      verified_at,
    } = req.body;

    // ---------------------------------------------
    // Start transaction
    // ---------------------------------------------

    await client.query(
      "BEGIN"
    );

    transactionStarted =
      true;

    // ---------------------------------------------
    // Check ownership
    // ---------------------------------------------

    const existing =
      await client.query(
        `
        SELECT *
        FROM vehicles
        WHERE id = $1
          AND user_id = $2
        FOR UPDATE;
        `,
        [id, user_id]
      );

    if (
      existing.rows.length === 0
    ) {
      await client.query(
        "ROLLBACK"
      );

      transactionStarted =
        false;

      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found.",
      });
    }

    const current =
      existing.rows[0];

    // ---------------------------------------------
    // Vehicle type
    // ---------------------------------------------

    if (
      vehicle_type !==
      undefined
    ) {
      vehicle_type =
        String(vehicle_type)
          .toLowerCase()
          .trim();

      if (
        !VALID_TYPES.includes(
          vehicle_type
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        transactionStarted =
          false;

        return res
          .status(400)
          .json({
            success: false,
            message: `Vehicle type must be one of: ${VALID_TYPES.join(
              ", "
            )}.`,
          });
      }
    } else {
      vehicle_type =
        current.vehicle_type;
    }

    // ---------------------------------------------
    // Vehicle number
    // ---------------------------------------------

    let vehicleNumberChanged =
      false;

    if (
      vehicle_number !==
      undefined
    ) {
      vehicle_number =
        normalizeVehicleNumber(
          vehicle_number
        );

      if (
        !isValidVehicleNumber(
          vehicle_number
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        transactionStarted =
          false;

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Enter a valid Indian vehicle registration number, e.g. MH02CD5678.",
          });
      }

      vehicleNumberChanged =
        vehicle_number !==
        normalizeVehicleNumber(
          current.vehicle_number
        );

      // ---------------------------------------------
      // Duplicate check
      // ---------------------------------------------

      const duplicateCheck =
        await client.query(
          `
          SELECT id
          FROM vehicles
          WHERE UPPER(
            REPLACE(vehicle_number, ' ', '')
          ) = $1
            AND id != $2
          LIMIT 1;
          `,
          [
            vehicle_number,
            id,
          ]
        );

      if (
        duplicateCheck.rows
          .length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        transactionStarted =
          false;

        return res
          .status(409)
          .json({
            success: false,
            message:
              "This vehicle number is already registered.",
          });
      }
    } else {
      vehicle_number =
        current.vehicle_number;
    }

    // ---------------------------------------------
    // Optional fields
    // ---------------------------------------------

    brand =
      brand !== undefined
        ? String(brand).trim()
        : current.brand;

    model =
      model !== undefined
        ? String(model).trim()
        : current.model;

    color =
      color !== undefined
        ? String(color)
            .toLowerCase()
            .trim()
        : current.color;

    // ---------------------------------------------
    // Verification
    // ---------------------------------------------

    if (vehicleNumberChanged) {
      /*
        If registration number changes,
        old verification is no longer valid.
      */

      verification_status =
        verification_status ===
        "verified"
          ? "verified"
          : "unverified";

      if (
        verification_status !==
        "verified"
      ) {
        verification_source =
          null;

        verified_at =
          null;
      }
    } else {
      /*
        Keep existing verification status
        when registration number did
        not change.
      */

      verification_status =
        verification_status ||
        current.verification_status ||
        "unverified";

      verification_source =
        verification_source !==
        undefined
          ? verification_source
          : current.verification_source;

      verified_at =
        verified_at !==
        undefined
          ? verified_at
          : current.verified_at;
    }

    // ---------------------------------------------
    // Default vehicle
    // ---------------------------------------------

    if (
      is_default !==
      undefined
    ) {
      is_default =
        parseBoolean(
          is_default
        );

      if (is_default) {
        await client.query(
          `
          UPDATE vehicles
          SET is_default = false
          WHERE user_id = $1
            AND is_default = true
            AND id != $2;
          `,
          [
            user_id,
            id,
          ]
        );
      }
    } else {
      is_default =
        current.is_default;
    }

    // ---------------------------------------------
    // Update vehicle
    // ---------------------------------------------

    const result =
      await client.query(
        `
        UPDATE vehicles
        SET
          vehicle_type = $1,
          vehicle_number = $2,
          brand = $3,
          model = $4,
          color = $5,
          is_default = $6,
          verification_status = $7,
          verification_source = $8,
          verified_at = $9
        WHERE id = $10
          AND user_id = $11
        RETURNING
          id,
          user_id,
          vehicle_type,
          vehicle_number,
          brand,
          model,
          color,
          is_default,
          verification_status,
          verification_source,
          verified_at,
          created_at;
        `,
        [
          vehicle_type,
          vehicle_number,
          brand || null,
          model || null,
          color || null,
          is_default,
          verification_status,
          verification_source ||
            null,
          verified_at ||
            null,
          id,
          user_id,
        ]
      );

    // ---------------------------------------------
    // Commit
    // ---------------------------------------------

    await client.query(
      "COMMIT"
    );

    transactionStarted =
      false;

    // ---------------------------------------------
    // Response
    // ---------------------------------------------

    return res.json({
      success: true,
      message:
        "Vehicle updated successfully.",
      vehicle:
        result.rows[0],
    });
  } catch (error) {
    // ---------------------------------------------
    // Rollback
    // ---------------------------------------------

    if (transactionStarted) {
      await client.query(
        "ROLLBACK"
      );
    }

    // ---------------------------------------------
    // Error log
    // ---------------------------------------------

    console.error(
      "Error updating vehicle:",
      getErrorDetails(error)
    );

    // ---------------------------------------------
    // Duplicate error
    // ---------------------------------------------

    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle number is already registered.",
      });
    }

    // ---------------------------------------------
    // General error
    // ---------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Failed to update vehicle.",
    });
  } finally {
    client.release();
  }
}

// =====================================================
// DELETE VEHICLE
// =====================================================

async function deleteVehicle(
  req,
  res
) {
  try {
    const user_id =
      req.user.id;

    const { id } =
      req.params;

    const result =
      await pool.query(
        `
        DELETE FROM vehicles
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
        `,
        [id, user_id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Vehicle deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Error deleting vehicle:",
      getErrorDetails(error)
    );

    // ---------------------------------------------
    // Foreign key error
    // ---------------------------------------------

    if (
      error.code === "23503"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this vehicle because it has existing bookings.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete vehicle.",
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  verifyVehicle,
};