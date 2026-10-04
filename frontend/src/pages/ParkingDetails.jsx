import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ParkingMap from "../components/map/ParkingMap";
import BookingModal from "../components/BookingModal";

import {
  ChevronLeftIcon,
  NavigationIcon,
} from "../components/Icons";

import { getLots, getSlots, getBookings } from "../services/api";
import { hasValidCoords } from "../utils/distance";
import {
  slotsForLot,
  ratesByType,
} from "../utils/pricing";

import "./ParkingDetails.css";

function buildDirectionsUrl(lat, lng) {
  if (!hasValidCoords(lat, lng)) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);

  const [stats, setStats] = useState({
    total: null,
    available: null,
    rates: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lotSlots, setLotSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadParkingDetails() {
      setLoading(true);
      setError("");

      try {
        const [lotsData, slotsData, bookingsData] = await Promise.all([
          getLots(),
          getSlots(),
          getBookings().catch(() => []),
        ]);

        const lotList = Array.isArray(lotsData)
          ? lotsData
          : [];

        const slotList = Array.isArray(slotsData)
          ? slotsData
          : [];

        const foundLot = lotList.find(
          (item) => String(item.id) === String(id)
        );

        if (!foundLot) {
          if (!cancelled) {
            setError(
              "This parking location wasn't found."
            );
          }

          return;
        }

        const lotSlots = slotsForLot(
          slotList,
          foundLot.id
        );

        if (!cancelled) {
          setLot(foundLot);
          setLotSlots(lotSlots);
          setBookings(
            Array.isArray(bookingsData)
              ? bookingsData
              : Array.isArray(bookingsData?.bookings)
              ? bookingsData.bookings
              : []
          );

          setStats({
            total:
              foundLot.total_slots ??
              lotSlots.length,

            available: lotSlots.filter(
              (slot) =>
                String(slot.status || "")
                  .trim()
                  .toLowerCase() === "available"
            ).length,

            rates: ratesByType(lotSlots),
          });
        }
      } catch (err) {
        console.error(
          "Parking details loading error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load parking details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadParkingDetails();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const directionsUrl = lot
    ? buildDirectionsUrl(
        lot.latitude,
        lot.longitude
      )
    : null;

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-content-narrow">
        <button
          type="button"
          className="details-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeftIcon size={18} />
          Back
        </button>

        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              className="skeleton"
              style={{
                height: 32,
                width: "60%",
                borderRadius: 8,
              }}
            />

            <div
              className="skeleton"
              style={{
                height: 120,
                borderRadius: 12,
              }}
            />
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <p
              className="empty-state-title"
              style={{ color: "var(--error)" }}
            >
              {error}
            </p>

            <Link
              to="/explore"
              className="btn-primary"
            >
              Back to Explore
            </Link>
          </div>
        )}

        {!loading && !error && lot && (
          <>
            <h1
              className="text-page-title"
              style={{ marginTop: 8 }}
            >
              {lot.name}
            </h1>

            <p
              className="text-secondary"
              style={{
                marginTop: 4,
                marginBottom: 20,
              }}
            >
              {lot.address || lot.location}
            </p>

            <ParkingMap lots={[lot]} />

            <div className="details-stats">
              <div className="card details-stat">
                <span className="text-caption">
                  Total Capacity
                </span>

                <span
                  className="text-card-title"
                  style={{ fontSize: 20 }}
                >
                  {stats.total ?? "—"}
                </span>
              </div>

              <div className="card details-stat">
                <span className="text-caption">
                  Available
                </span>

                <span
                  className="text-card-title"
                  style={{
                    fontSize: 20,
                    color: "var(--accent-blue)",
                  }}
                >
                  {stats.available ?? "—"}
                </span>
              </div>
            </div>

            {Object.keys(stats.rates).length > 0 && (
              <>
                <h2
                  className="text-section-title"
                  style={{
                    fontSize: 16,
                    marginTop: 20,
                    marginBottom: 10,
                  }}
                >
                  Hourly Rates
                </h2>

                <div className="details-stats">
                  {["car", "bike", "scooter"].map(
                    (type) =>
                      stats.rates[type] != null && (
                        <div
                          className="card details-stat"
                          key={type}
                        >
                          <span
                            className="text-caption"
                            style={{
                              textTransform:
                                "capitalize",
                            }}
                          >
                            {type}
                          </span>

                          <span
                            className="text-card-title"
                            style={{ fontSize: 18 }}
                          >
                            ₹{stats.rates[type]}/hr
                          </span>
                        </div>
                      )
                  )}
                </div>
              </>
            )}

            {Array.isArray(lot.amenities) &&
              lot.amenities.length > 0 && (
                <>
                  <h2
                    className="text-section-title"
                    style={{
                      fontSize: 16,
                      marginTop: 24,
                      marginBottom: 10,
                    }}
                  >
                    Amenities
                  </h2>

                  <div className="details-amenities">
                    {lot.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="badge badge-type"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </>
              )}

            {!directionsUrl && (
              <p
                className="text-caption"
                style={{ marginTop: 20 }}
              >
                Directions aren't available — this
                location has no coordinates on file.
              </p>
            )}

            {directionsUrl && (
              <a
                className="btn-secondary details-directions-btn"
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 20,
                  marginBottom: 8,
                }}
              >
                <NavigationIcon size={14} />
                Get Directions
              </a>
            )}

            <h2
              className="text-section-title"
              style={{
                fontSize: 16,
                marginTop: 24,
                marginBottom: 14,
              }}
            >
              Book a Slot
            </h2>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowBooking(true)}
            >
              Book a Slot
            </button>

            {showBooking && (
              <BookingModal
                lot={lot}
                slots={lotSlots}
                bookings={bookings}
                onClose={() => setShowBooking(false)}
                onBooked={() => setShowBooking(false)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ParkingDetails;