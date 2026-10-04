import { useState } from "react";
import { cancelBooking } from "../services/api";
import { VehicleTypeIcon, CalendarIcon } from "./Icons";

function formatTime12(t) {
  if (!t) return "";

  const parts = t.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h)) return t;

  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;

  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatAmount(amount) {
  if (amount == null) return null;
  return `₹${parseFloat(amount).toFixed(2)}`;
}

const cleanText = (v) => {
  if (v === null || v === undefined) return "";

  const s = String(v).trim();
  const lower = s.toLowerCase();

  if (!s || lower === "null" || lower === "undefined") {
    return "";
  }

  return s;
};

const VEHICLE_TYPE_LABELS = {
  car: "Car",
  bike: "Bike",
  scooter: "Scooter",
  auto: "Auto",
};

function BookingCard({ booking, onCancelled }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const bookingId = booking.booking_id || booking.id;

  const lotName =
    booking.parking_lot ||
    booking.lot_name ||
    "ParkEase Lot";

  const location =
    booking.location ||
    "Main Parking Area";

  const status = booking.status || "confirmed";

  const isConfirmed =
    status === "confirmed" || status === "active";

  const isCompleted = status === "completed";

  /*
   * VEHICLE INFORMATION
   *
   * Supports both:
   * booking.brand
   * booking.vehicle.brand
   *
   * Same for model, number, color and type.
   */

  const vehicle = booking.vehicle || {};

  const vehicleName = [
    cleanText(booking.brand || vehicle.brand),
    cleanText(booking.model || vehicle.model),
  ]
    .filter(Boolean)
    .join(" ");

  const vehicleNumber = cleanText(
    booking.vehicle_number ||
    booking.registration_number ||
    vehicle.vehicle_number ||
    vehicle.registration_number
  );

  const vehicleColor = cleanText(
    booking.color ||
    vehicle.color
  );

  const vehicleTypeRaw = cleanText(
    booking.vehicle_type ||
    booking.type ||
    vehicle.vehicle_type ||
    vehicle.type
  ).toLowerCase();

  const vehicleTypeLabel = vehicleTypeRaw
    ? VEHICLE_TYPE_LABELS[vehicleTypeRaw] ||
      vehicleTypeRaw.charAt(0).toUpperCase() +
        vehicleTypeRaw.slice(1)
    : "";

  const hasVehicle = Boolean(
    vehicleName ||
    vehicleNumber ||
    vehicleColor ||
    vehicleTypeRaw
  );

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await cancelBooking(bookingId);
      onCancelled();
    } catch (err) {
      alert(err.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
      setConfirmOpen(false);
    }
  };

  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <span className="badge badge-confirmed">
          Confirmed
        </span>
      );
    }

    if (isCompleted) {
      return (
        <span className="badge badge-completed">
          Completed
        </span>
      );
    }

    return (
      <span className="badge badge-cancelled">
        Cancelled
      </span>
    );
  };

  return (
    <div className="booking-card">

      <div className="booking-card-header">
        <div className="booking-card-title-row">
          <span className="booking-card-slot">
            Slot {booking.slot_number}
          </span>

          {getStatusBadge()}

          {booking.slot_vehicle_type && (
            <span className="badge badge-type">
              {booking.slot_vehicle_type}
            </span>
          )}
        </div>

        <span className="booking-card-id">
          Booking #{bookingId}
        </span>
      </div>

      <div className="booking-card-body">

        {/* PARKING LOCATION */}
        <div className="booking-card-field">
          <div className="booking-card-field-label">
            Parking Location
          </div>

          <div className="booking-card-field-value">
            {lotName} · {location}
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="booking-card-field">
          <div className="booking-card-field-label">
            Schedule
          </div>

          <div
            className="booking-card-field-value"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CalendarIcon size={13} />

            <span>
              {booking.booking_date} ·{" "}
              {formatTime12(booking.start_time)} –{" "}
              {formatTime12(booking.end_time)}
            </span>
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="booking-card-field">

          <div className="booking-card-field-label">
            Vehicle Details
            {vehicleTypeLabel
              ? ` · ${vehicleTypeLabel}`
              : ""}
          </div>

          {hasVehicle ? (
            <div
              className="booking-card-field-value"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >

              <span
                style={{
                  display: "flex",
                  marginTop: 2,
                }}
              >
                <VehicleTypeIcon
                  type={vehicleTypeRaw}
                  size={15}
                />
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >

                {vehicleName && (
                  <span style={{ fontWeight: 600 }}>
                    {vehicleName}
                  </span>
                )}

                {vehicleNumber && (
                  <span
                    style={{
                      letterSpacing: "0.03em",
                    }}
                  >
                    {vehicleNumber}
                  </span>
                )}

                {vehicleColor && (
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {vehicleColor}
                  </span>
                )}

              </div>
            </div>
          ) : (
            <div className="booking-card-field-value-muted">
              Vehicle not specified
            </div>
          )}
        </div>

        {/* TOTAL AMOUNT */}
        {booking.total_amount != null && (
          <div className="booking-card-field">

            <div className="booking-card-field-label">
              Total Amount
            </div>

            <div className="booking-card-amount">
              {formatAmount(booking.total_amount)}
            </div>

          </div>
        )}

      </div>

      {/* CANCEL BOOKING */}
      {isConfirmed && (
        <div className="booking-card-footer">

          {confirmOpen ? (
            <div
              className="confirm-strip"
              style={{
                width: "100%",
                justifyContent: "flex-end",
              }}
            >

              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginRight: "auto",
                }}
              >
                Cancel this reservation?
              </span>

              <button
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                }}
                onClick={() => setConfirmOpen(false)}
                disabled={cancelling}
              >
                Keep
              </button>

              <button
                className="btn-danger"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                }}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? "Cancelling..."
                  : "Confirm cancel"}
              </button>

            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <button
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  color: "var(--error)",
                }}
                onClick={() => setConfirmOpen(true)}
              >
                Cancel Booking
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default BookingCard;