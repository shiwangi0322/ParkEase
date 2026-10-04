const pool = require("../db");

// =====================================================
// GET ALL BOOKINGS
// =====================================================
async function getAllBookings(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        b.id AS booking_id,
        u.name AS user_name,
        u.email,
        s.slot_number,
        l.name AS parking_lot,
        l.location,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status,
        v.id AS vehicle_id,
        v.vehicle_type,
        v.vehicle_number,
        v.brand,
        v.model,
        v.color
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN slots s ON b.slot_id = s.id
      JOIN lots l ON s.lot_id = l.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id DESC;
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
}

// =====================================================
// GET MY BOOKINGS
// =====================================================
async function getMyBookings(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        b.id AS booking_id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status,
        b.total_amount,
        s.id AS slot_id,
        s.slot_number,
        s.vehicle_type AS slot_vehicle_type,
        l.id AS lot_id,
        l.name AS parking_lot,
        l.location,
        v.id AS vehicle_id,
        v.vehicle_type,
        v.vehicle_number,
        v.brand,
        v.model,
        v.color
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN lots l ON s.lot_id = l.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.start_time DESC;
      `,
      [userId]
    );

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Error fetching my bookings:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings",
      error: error.message,
    });
  }
}

// =====================================================
// CREATE NEW BOOKING - CONCURRENCY SAFE
// =====================================================
async function createBooking(req, res) {
  const client = await pool.connect();

  try {
    const { slot_id, booking_date, start_time, end_time, vehicle_id } = req.body;

    // Logged-in user comes from JWT
    const user_id = req.user.id;

    // Validate input
    if (!slot_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        message: "slot_id, booking_date, start_time and end_time are required",
      });
    }

    // Start transaction
    await client.query("BEGIN");

    // Lock the parking slot
    const slotResult = await client.query(
      `
      SELECT id, slot_number, status, vehicle_type, price_per_hour
      FROM slots
      WHERE id = $1
      FOR UPDATE;
      `,
      [slot_id]
    );

    // Slot doesn't exist
    if (slotResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Parking slot not found",
      });
    }

    const slot = slotResult.rows[0];

    // Vehicle is optional, but if provided it must belong to the logged-in user
    // and its type must match the slot's supported vehicle type
    if (vehicle_id) {
      const vehicleCheck = await client.query(
        `SELECT id, vehicle_type FROM vehicles WHERE id = $1 AND user_id = $2`,
        [vehicle_id, user_id]
      );

      if (vehicleCheck.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Vehicle not found or does not belong to you",
        });
      }

      const vehicle = vehicleCheck.rows[0];

      if (slot.vehicle_type && vehicle.vehicle_type !== slot.vehicle_type) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Vehicle type does not match parking slot type",
        });
      }
    }

    // Slot has no price configured yet
    if (slot.price_per_hour === null) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Pricing is not configured for this slot yet",
      });
    }

    // Calculate booking duration in hours
    const [startH, startM] = start_time.split(":").map(Number);
    const [endH, endM] = end_time.split(":").map(Number);
    const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;

    if (durationHours <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "end_time must be after start_time",
      });
    }

    // Calculate total price (backend-controlled, never trust frontend price)


const billedHours = Math.ceil(durationHours);

const total_amount = parseFloat(
  (billedHours * slot.price_per_hour).toFixed(2)
);

    // Check for conflicting booking
    const conflict = await client.query(
      `
      SELECT id
      FROM bookings
      WHERE slot_id = $1
        AND booking_date = $2
        AND status = 'confirmed'
        AND start_time < $4
        AND end_time > $3
      LIMIT 1;
      `,
      [slot_id, booking_date, start_time, end_time]
    );

    // Slot already booked
    if (conflict.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "This parking slot is already booked for this time.",
      });
    }

    // Create booking
    const result = await client.query(
      `
      INSERT INTO bookings
      (
        user_id,
        slot_id,
        booking_date,
        start_time,
        end_time,
        status,
        vehicle_id,
        total_amount
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
      RETURNING *;
      `,
      [user_id, slot_id, booking_date, start_time, end_time, vehicle_id || null, total_amount]
    );

    // Commit transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Booking created and awaiting payment",
      booking: result.rows[0],
    });
  } catch (error) {
    // Rollback if anything fails
    await client.query("ROLLBACK");

    console.error("Error creating booking:", error);

    // Unique constraint protection
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This parking slot is already booked.",
      });
    }

    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  } finally {
    // Always release database connection
    client.release();
  }
}

// =====================================================
// CANCEL BOOKING
// =====================================================
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;

    // Get logged-in user's ID from JWT
    const userId = req.user.id;

    // Cancel only user's own confirmed booking
    const result = await pool.query(
      `
      UPDATE bookings
      SET status = 'cancelled'
      WHERE id = $1
        AND user_id = $2
        AND status = 'confirmed'
      RETURNING *;
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found, already cancelled, or does not belong to you",
      });
    }

    res.json({
      message: "Booking cancelled successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);

    res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
}

module.exports = {
  getAllBookings,
  getMyBookings,
  createBooking,
  cancelBooking,
};
