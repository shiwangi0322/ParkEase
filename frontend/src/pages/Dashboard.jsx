import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {
  Search,
  CalendarDays,
  MapPin,
  Check,
  ChevronRight,
  Clock,
  Home,
  Compass,
  Car,
} from "lucide-react";

import Navbar from "../components/Navbar";


import carImage from "../assets/CAR.png";
import bikeImage from "../assets/bike.png";
import scooterImage from "../assets/SCOOTER.png";

import {
  getLots,
  getSlots,
  getVehicles,
  getMyBookings,
  getUser,
} from "../services/api";

import {
  getParkingImage,
  parkingImages,
} from "../data/parkingImages";

import {
  slotsForLot,
  lowestRate,
} from "../utils/pricing";

import {
  distanceKm,
  formatDistance,
  hasValidCoords,
} from "../utils/distance";

import "./Dashboard.css";

/* =========================================================
   VEHICLE TYPES
   ========================================================= */

const VEHICLE_TYPES = [
  {
    type: "car",
    label: "Car",
    image: carImage,
  },
  {
    type: "bike",
    label: "Bike",
    image: bikeImage,
  },
  {
    type: "scooter",
    label: "Scooter",
    image: scooterImage,
  },
];

const MAX_NEARBY = 6;

/* =========================================================
   HELPERS
   ========================================================= */

function greeting() {
  const h = new Date().getHours();

  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";

  return "Good evening";
}

const dateOnly = (v) => String(v || "").slice(0, 10);

function formatBookingDate(v) {
  const [y, m, d] = dateOnly(v).split("-").map(Number);

  if (!y || !m || !d) return "";

  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime12(t) {
  if (!t) return "";

  const [hh, mm] = String(t).split(":");

  const h = parseInt(hh, 10);

  if (Number.isNaN(h)) return String(t);

  return `${h % 12 || 12}:${String(
    parseInt(mm, 10) || 0
  ).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function statusClass(status) {
  const s = String(status || "confirmed").toLowerCase();

  if (s === "cancelled" || s === "canceled") {
    return "dash-status dash-status--cancelled";
  }

  if (s === "completed") {
    return "dash-status dash-status--completed";
  }

  return "dash-status dash-status--confirmed";
}

function statusLabel(status) {
  const s = String(status || "confirmed").toLowerCase();

  if (s === "canceled" || s === "cancelled") {
    return "Cancelled";
  }

  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  const user = getUser();

  const firstName = user?.name
    ? user.name.trim().split(/\s+/)[0]
    : "";

  const [lots, setLots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [selectedVehicleType, setSelectedVehicleType] =
    useState(null);

  const [query, setQuery] = useState("");

  const [userPosition, setUserPosition] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const nearbyRef = useRef(null);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [
          lotsData,
          slotsData,
          vehiclesData,
          bookingsData,
        ] = await Promise.all([
          getLots().catch(() => []),
          getSlots().catch(() => []),
          getVehicles().catch(() => []),
          getMyBookings().catch(() => []),
        ]);

        if (!mounted) return;

        setLots(
          Array.isArray(lotsData)
            ? lotsData
            : []
        );

        setSlots(
          Array.isArray(slotsData)
            ? slotsData
            : []
        );

        setVehicles(
          Array.isArray(vehiclesData)
            ? vehiclesData
            : Array.isArray(vehiclesData?.vehicles)
            ? vehiclesData.vehicles
            : []
        );

        setBookings(
          Array.isArray(bookingsData)
            ? bookingsData
            : []
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     DEV IMAGE MAPPING
     ========================================================= */

  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      lots.length === 0
    ) {
      return;
    }

    console.table(
      lots.map((l) => ({
        id: l.id,
        name: l.name,
        image: getParkingImage(l),
        dedicated:
          Object.prototype.hasOwnProperty.call(
            parkingImages,
            String(l.name || "")
              .trim()
              .toUpperCase()
          ),
      }))
    );
  }, [lots]);

  /* =========================================================
     GEOLOCATION
     ========================================================= */

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {}
    );
  }, []);

  /* =========================================================
     LOT STATS
     ========================================================= */

  const lotStats = useMemo(
    () =>
      lots.map((lot) => {
        const lotSlots = slotsForLot(
          slots,
          lot.id
        );

        const km =
          userPosition &&
          hasValidCoords(
            lot.latitude,
            lot.longitude
          )
            ? distanceKm(
                userPosition.lat,
                userPosition.lng,
                lot.latitude,
                lot.longitude
              )
            : null;

        return {
          lot,

          total:
            lot.total_slots ??
            lotSlots.length,

          available:
            lotSlots.filter(
              (s) => s.status === "available"
            ).length,

          price:
            lowestRate(lotSlots),

          km,
        };
      }),
    [lots, slots, userPosition]
  );

  /* =========================================================
     NEARBY PARKING
     ========================================================= */

  const nearby = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = lotStats;

    if (q) {
      list = list.filter(({ lot }) =>
        [
          lot.name,
          lot.location,
          lot.address,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field)
              .toLowerCase()
              .includes(q)
          )
      );
    }

    if (userPosition) {
      list = [...list].sort(
        (a, b) =>
          (a.km ?? Infinity) -
          (b.km ?? Infinity)
      );
    }

    return list;
  }, [
    lotStats,
    query,
    userPosition,
  ]);

  /* =========================================================
     VEHICLE COUNTS
     ========================================================= */

  const registeredByType = useMemo(() => {
    const counts = {};

    for (const vehicle of vehicles) {
      const type = String(
        vehicle.vehicle_type || ""
      )
        .trim()
        .toLowerCase();

      if (!type) continue;

      /*
       * Normalize common vehicle names.
       */
      let normalizedType = type;

      if (
        type === "motorcycle" ||
        type === "motorbike"
      ) {
        normalizedType = "bike";
      }

      if (
        type === "scooty"
      ) {
        normalizedType = "scooter";
      }

      counts[normalizedType] =
        (counts[normalizedType] || 0) + 1;
    }

    return counts;
  }, [vehicles]);

  /* =========================================================
     RECENT BOOKING
     ========================================================= */

  const recentBooking = useMemo(() => {
    const key = (booking) =>
      dateOnly(booking.booking_date) +
      String(booking.start_time || "");

    return (
      [...bookings].sort(
        (a, b) =>
          key(b).localeCompare(key(a))
      )[0] ?? null
    );
  }, [bookings]);

  /* =========================================================
     FIND PARKING
     ========================================================= */

  const handleFindParking = (e) => {
    e.preventDefault();

    nearbyRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =========================================================
     VEHICLE FILTER
     ========================================================= */

  const toggleVehicleType = (type) => {
    setSelectedVehicleType((current) =>
      current === type
        ? null
        : type
    );
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="page-wrapper">

      {/* =====================================================
          DESKTOP TOP NAVBAR
          ===================================================== */}

      <div className="dashboard-top-navbar">
        <Navbar />
      </div>

      <main className="dash">

        {/* ===================================================
            HERO / SEARCH
            =================================================== */}

        <section
          className="dash-hero"
          aria-label="Find parking"
        >
          <div
            className="dash-hero-photo"
            aria-hidden="true"
          >
            <img
              src={getParkingImage(lots[0])}
              alt=""
              decoding="async"
            />
          </div>

          <div
            className="dash-hero-art"
            aria-hidden="true"
          />

          <div className="dash-hero-body">

            <p className="dash-hero-eyebrow">
              ParkEase
            </p>

            <h1 className="dash-hero-title">
              {greeting()}
              {firstName
                ? `, ${firstName}`
                : ""}
            </h1>

            <p className="dash-hero-sub">
              Find a parking spot near you.
            </p>

            <form
              className="dash-search"
              onSubmit={handleFindParking}
            >

              {/* Search */}

              <label className="dash-search-field dash-search-field--grow">

                <Search
                  size={18}
                  aria-hidden="true"
                />

                <input
                  type="text"
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                  placeholder="Where do you want to park?"
                  aria-label="Search parking by name or location"
                />

              </label>

              {/* Today */}

              <div
                className="dash-search-field dash-search-date"
                title="Pick date and time in the booking step"
              >

                <CalendarDays
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  Today
                </span>

              </div>

              {/* Find Parking */}

              <button
                type="submit"
                className="dash-btn-gold"
              >
                Find Parking
              </button>

            </form>

          </div>
        </section>

        {/* ===================================================
            VEHICLE SELECTOR
            =================================================== */}

        <section
          className="dash-section"
          aria-labelledby="dash-vehicle-title"
        >

          <div className="dash-section-head">

            <h2
              id="dash-vehicle-title"
              className="dash-section-title"
            >
              Your Vehicle
            </h2>

            {selectedVehicleType && (
              <button
                type="button"
                className="dash-link-btn"
                onClick={() =>
                  setSelectedVehicleType(null)
                }
              >
                Show all slots
              </button>
            )}

          </div>

          <div className="dash-vehicles">

            {VEHICLE_TYPES.map(
              ({
                type,
                label,
                image,
              }) => {

                const selected =
                  selectedVehicleType === type;

                const count =
                  registeredByType[type] || 0;

                return (
                  <button
                    key={type}
                    type="button"
                    className={`dash-vehicle${
                      selected
                        ? " dash-vehicle--selected"
                        : ""
                    }`}
                    aria-pressed={selected}
                    onClick={() =>
                      toggleVehicleType(type)
                    }
                  >

                    {/* Selected check */}

                    {selected && (
                      <span
                        className="dash-vehicle-check"
                        aria-hidden="true"
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                        />
                      </span>
                    )}

                    {/* Vehicle image */}

                    <span className="dash-vehicle-icon">

                      <img
                        src={image}
                        alt={label}
                        loading="lazy"
                      />

                    </span>

                    {/* Vehicle name */}

                    <span className="dash-vehicle-label">
                      {label}
                    </span>

                    {/* Registered count */}

                    {count > 0 ? (
                      <span className="dash-vehicle-count">
                        {count}{" "}
                        {count === 1
                          ? "registered"
                          : "registered"}
                      </span>
                    ) : (
                      <span className="dash-vehicle-count">
                        Not added
                      </span>
                    )}

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* ===================================================
            NEARBY PARKING
            =================================================== */}

        <section
          className="dash-section"
          ref={nearbyRef}
          aria-labelledby="dash-nearby-title"
        >

          <div className="dash-section-head">

            <h2
              id="dash-nearby-title"
              className="dash-section-title"
            >
              Nearby Parking
            </h2>

            <Link
              to="/explore"
              className="dash-link-btn"
            >
              See all

              <ChevronRight
                size={14}
                aria-hidden="true"
              />
            </Link>

          </div>

          {loading ? (

            <div className="dash-lots">

              {Array.from({
                length: 3,
              }).map((_, i) => (

                <div
                  key={i}
                  className="skeleton dash-lot-skeleton"
                />

              ))}

            </div>

          ) : nearby.length === 0 ? (

            <div className="dash-empty">

              {query.trim()
                ? "No parking locations match your search."
                : "No parking locations available right now."}

            </div>

          ) : (

            <div className="dash-lots">

              {nearby
                .slice(0, MAX_NEARBY)
                .map(
                  (
                    {
                      lot,
                      total,
                      available,
                      price,
                      km,
                    },
                    i
                  ) => {

                    const distance =
                      km != null
                        ? formatDistance(km)
                        : null;

                    const pct =
                      total > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (available /
                                total) *
                                100
                            )
                          )
                        : 0;

                    const tone =
                      available === 0
                        ? "full"
                        : pct <= 25
                        ? "limited"
                        : "open";

                    return (
                      <Link
                        key={lot.id}
                        to={`/parking/${lot.id}`}
                        className={`dash-lot dash-lot--${tone}`}
                        style={{
                          "--i": i,
                        }}
                        aria-label={`View details for ${lot.name}`}
                      >

                        <div className="dash-lot-media">

                          <img
                            src={getParkingImage(lot)}
                            alt=""
                            loading="lazy"
                          />

                        </div>

                        <div className="dash-lot-body">

                          <h3 className="dash-lot-name">
                            {lot.name}
                          </h3>

                          <div className="dash-lot-row">

                            <p className="dash-lot-loc">

                              <MapPin
                                size={14}
                                aria-hidden="true"
                              />

                              <span>
                                {lot.address ||
                                  lot.location}
                              </span>

                            </p>

                            {distance && (
                              <span className="dash-lot-dist">
                                {distance}
                              </span>
                            )}

                          </div>

                          <div className="dash-lot-meta">

                            <span className="dash-avail">

                              <span
                                className="dash-avail-dot"
                                aria-hidden="true"
                              />

                              {available}{" "}

                              {available === 1
                                ? "slot"
                                : "slots"}

                            </span>

                            <span className="dash-lot-price">

                              {price != null ? (
                                <>
                                  ₹{price}

                                  <small>
                                    /hour
                                  </small>
                                </>
                              ) : (
                                <small>
                                  Rate unavailable
                                </small>
                              )}

                            </span>

                          </div>

                          <span className="dash-btn-outline">
                            View Details
                          </span>

                        </div>

                      </Link>
                    );
                  }
                )}

            </div>
          )}

        </section>

        {/* ===================================================
            RECENT BOOKING
            =================================================== */}

        {!loading &&
          recentBooking && (

            <section
              className="dash-section"
              aria-labelledby="dash-recent-title"
            >

              <div className="dash-section-head">

                <h2
                  id="dash-recent-title"
                  className="dash-section-title"
                >
                  Recent Booking
                </h2>

              </div>

              <Link
                to="/bookings"
                className="dash-recent"
              >

                <img
                  className="dash-recent-img"
                  src={getParkingImage({
                    name:
                      recentBooking.parking_lot ||
                      recentBooking.lot_name,
                  })}
                  alt=""
                  loading="lazy"
                />

                <div className="dash-recent-body">

                  <div className="dash-recent-top">

                    <h3 className="dash-lot-name">

                      {recentBooking.parking_lot ||
                        recentBooking.lot_name ||
                        "ParkEase Lot"}

                    </h3>

                    <span
                      className={statusClass(
                        recentBooking.status
                      )}
                    >
                      {statusLabel(
                        recentBooking.status
                      )}
                    </span>

                  </div>

                  <p className="dash-recent-line">

                    {[
                      recentBooking.brand,
                      recentBooking.model,
                    ]
                      .filter(Boolean)
                      .join(" ") ||

                      recentBooking.vehicle_number ||

                      "Vehicle not specified"}

                    {recentBooking.slot_number
                      ? ` · Slot ${recentBooking.slot_number}`
                      : ""}

                  </p>

                  <p className="dash-recent-line dash-recent-when">

                    <CalendarDays
                      size={13}
                      aria-hidden="true"
                    />

                    {formatBookingDate(
                      recentBooking.booking_date
                    )}

                    <Clock
                      size={13}
                      aria-hidden="true"
                    />

                    {formatTime12(
                      recentBooking.start_time
                    )}

                    {" – "}

                    {formatTime12(
                      recentBooking.end_time
                    )}

                  </p>

                </div>

                <span className="dash-btn-outline dash-recent-btn">
                  View Booking
                </span>

              </Link>

            </section>
          )}

        {/* ===================================================
            BOOK A SLOT
            =================================================== */}

   
      </main>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <nav
        className="mobile-dashboard-nav"
        aria-label="Mobile navigation"
      >

        <Link
          to="/"
          className="mobile-dashboard-nav__item active"
        >

          <Home
            size={21}
            aria-hidden="true"
          />

          <span>
            Dashboard
          </span>

        </Link>

        <Link
          to="/explore"
          className="mobile-dashboard-nav__item"
        >

          <Compass
            size={21}
            aria-hidden="true"
          />

          <span>
            Explore
          </span>

        </Link>

        <Link
          to="/bookings"
          className="mobile-dashboard-nav__item"
        >

          <CalendarDays
            size={21}
            aria-hidden="true"
          />

          <span>
            Bookings
          </span>

        </Link>

        <Link
          to="/vehicles"
          className="mobile-dashboard-nav__item"
        >

          <Car
            size={21}
            aria-hidden="true"
          />

          <span>
            Vehicles
          </span>

        </Link>

      </nav>

    </div>
  );
}

export default Dashboard;