const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../db");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================
const createPaymentOrder = async (req, res) => {
  try {
    const { booking_id, amount } = req.body;

    if (!booking_id || !amount) {
      return res.status(400).json({
        message: "booking_id and amount are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount",
      });
    }

    // Check booking belongs to logged-in user
    const bookingResult = await pool.query(
      `
      SELECT id
      FROM bookings
      WHERE id = $1
        AND user_id = $2
      `,
      [booking_id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Amount is in paise for Razorpay
    const options = {
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `booking_${booking_id}`,
    };

    const order = await razorpay.orders.create(options);

    const paymentResult = await pool.query(
      `
      INSERT INTO payments
      (
        booking_id,
        provider,
        razorpay_order_id,
        amount,
        status
      )
      VALUES ($1, 'razorpay', $2, $3, 'created')
      RETURNING *
      `,
      [
        booking_id,
        order.id,
        numericAmount,
      ]
    );

    res.status(201).json({
      message: "Payment order created",
      order,
      payment: paymentResult.rows[0],
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !booking_id
    ) {
      return res.status(400).json({
        message: "Payment verification data is incomplete",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    const paymentResult = await pool.query(
      `
      UPDATE payments
      SET
        razorpay_payment_id = $1,
        status = 'paid',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
        AND razorpay_order_id = $3
      RETURNING *
      `,
      [
        razorpay_payment_id,
        booking_id,
        razorpay_order_id,
      ]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    // Confirm booking only after successful verification
    const bookingResult = await pool.query(
      `
      UPDATE bookings
      SET status = 'confirmed'
      WHERE id = $1
        AND user_id = $2
      RETURNING *
      `,
      [booking_id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    res.json({
      message: "Payment verified successfully",
      payment: paymentResult.rows[0],
      booking: bookingResult.rows[0],
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};