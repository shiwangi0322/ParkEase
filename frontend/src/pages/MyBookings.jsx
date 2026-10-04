import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import BookingCard from "../components/BookingCard";
import { CalendarIcon } from "../components/Icons";
import { getMyBookings, getVehicles } from "../services/api";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const toastTimerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      // Get bookings and vehicles together.
      const [bookingData, vehicleData] = await Promise.all([
        getMyBookings(),
        getVehicles(),
      ]);

      const bookingList = Array.isArray(bookingData)
        ? bookingData
        : Array.isArray(bookingData?.bookings)
          ? bookingData.bookings
          : [];

      const vehicleList = Array.isArray(vehicleData)
        ? vehicleData
        : Array.isArray(vehicleData?.vehicles)
          ? vehicleData.vehicles
          : [];

      /*
       * Attach the user's vehicle information to each booking.
       *
       * Existing booking data is preserved.
       * We only add vehicle information when vehicle_id matches.
       */
      const enrichedBookings = bookingList.map((booking) => {
        const vehicleId =
          booking.vehicle_id ??
          booking.vehicleId ??
          booking.vehicle?.id ??
          null;

        if (vehicleId == null) {
          return booking;
        }

        const vehicle = vehicleList.find(
          (v) => String(v.id) === String(vehicleId)
        );

        if (!vehicle) {
          return booking;
        }

        return {
          ...booking,

          // Keep direct fields available to BookingCard.
          brand: booking.brand ?? vehicle.brand,
          model: booking.model ?? vehicle.model,
          vehicle_number:
            booking.vehicle_number ??
            vehicle.vehicle_number,
          color: booking.color ?? vehicle.color,
          vehicle_type:
            booking.vehicle_type ??
            vehicle.vehicle_type,

          // Also keep the nested vehicle object.
          vehicle: {
            ...vehicle,
            ...(booking.vehicle || {}),
          },
        };
      });

      setBookings(enrichedBookings);
    } catch (err) {
      console.error("Failed to load bookings:", err);

      setError(
        "Unable to load your bookings. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleCancelled = () => {
    setToast("Booking cancelled successfully.");

    load();

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 3500);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content-narrow">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="text-page-title">
              My Bookings
            </h1>

            <p
              className="text-secondary"
              style={{ marginTop: 4 }}
            >
              View and manage your active and past parking reservations.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="btn-secondary"
          >
            Find Parking
          </Link>
        </div>

        {toast && (
          <div
            role="status"
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #BAE6FD",
              background: "#F0F9FF",
              color: "#0369A1",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {toast}
          </div>
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="skeleton"
                style={{
                  height: 120,
                  borderRadius: 12,
                }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <p
              className="empty-state-title"
              style={{ color: "var(--error)" }}
            >
              Failed to load bookings
            </p>

            <p className="empty-state-body">
              {error}
            </p>

            <button
              className="btn-primary"
              onClick={load}
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CalendarIcon size={48} />
              </div>

              <p className="empty-state-title">
                No bookings yet
              </p>

              <p className="empty-state-body">
                Your reserved parking spaces will appear
                here. Choose a slot on the dashboard to
                make your first booking.
              </p>

              <Link
                to="/dashboard"
                className="btn-primary"
              >
                Book Parking
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          bookings.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {bookings.map((booking) => (
                <BookingCard
                  key={
                    booking.booking_id ||
                    booking.id
                  }
                  booking={booking}
                  onCancelled={handleCancelled}
                />
              ))}
            </div>
          )}
      </main>
    </div>
  );
}

export default MyBookings;