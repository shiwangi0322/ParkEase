import { useEffect, useMemo, useState } from "react";

import {
  createBooking,
  getVehicles,
  createPaymentOrder,
  verifyPayment,
} from "../services/api";

import ParkingSlot from "./ParkingSlot";

function localToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function normalizeType(type) {
  return String(type || "")
    .trim()
    .toLowerCase();
}

function timesOverlap(
  requestedStart,
  requestedEnd,
  bookingStart,
  bookingEnd
) {
  return (
    requestedStart < bookingEnd &&
    requestedEnd > bookingStart
  );
}

function getVehicleType(vehicle) {
  return normalizeType(
    vehicle?.vehicle_type ||
      vehicle?.type ||
      vehicle?.category
  );
}

// --------------------------------------------------
// VEHICLE ICON
// --------------------------------------------------

function getVehicleIcon(vehicle) {
  const type = getVehicleType(vehicle);

  if (
    type === "bike" ||
    type === "motorcycle" ||
    type === "motorbike"
  ) {
    return "🏍️";
  }

  if (
    type === "scooter" ||
    type === "scooty"
  ) {
    return "🛵";
  }

  return "🚗";
}

function BookingModal({
  lot,
  slots = [],
  bookings = [],
  initialDate,
  filterVehicleType = null,
  onClose,
  onBooked,
}) {
  /*
   * 1 = Vehicle
   * 2 = Date
   * 3 = Time
   * 4 = Slot
   * 5 = Review
   * 6 = Payment
   * 7 = Success
   */

  const [step, setStep] = useState(1);

  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] =
    useState(true);

  const [selectedVehicle, setSelectedVehicle] =
    useState(null);

  const [date, setDate] = useState(
    initialDate || localToday()
  );

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [successData, setSuccessData] =
    useState(null);

  const [paymentData, setPaymentData] =
    useState(null);

  // ==================================================
  // LOAD RAZORPAY SCRIPT
  // ==================================================

  useEffect(() => {
    if (window.Razorpay) {
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    document.body.appendChild(script);

    return () => {
      // Keep script loaded.
    };
  }, []);

  // ==================================================
  // LOAD VEHICLES
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const loadVehicles = async () => {
      setVehicleLoading(true);

      try {
        const data = await getVehicles();

        if (!mounted) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.vehicles)
          ? data.vehicles
          : [];

        setVehicles(list);

        const compatible = filterVehicleType
          ? list.filter(
              (vehicle) =>
                getVehicleType(vehicle) ===
                normalizeType(filterVehicleType)
            )
          : list;

        const defaultVehicle =
          compatible.find(
            (vehicle) =>
              vehicle.is_default === true ||
              vehicle.is_default === 1
          ) || compatible[0];

        setSelectedVehicle(
          defaultVehicle || null
        );
      } catch (err) {
        console.error(
          "Vehicle loading error:",
          err
        );

        setError(
          "Unable to load your vehicles."
        );
      } finally {
        if (mounted) {
          setVehicleLoading(false);
        }
      }
    };

    loadVehicles();

    return () => {
      mounted = false;
    };
  }, [filterVehicleType]);

  // ==================================================
  // COMPATIBLE VEHICLES
  // ==================================================

  const compatibleVehicles = useMemo(() => {
    if (!filterVehicleType) {
      return vehicles;
    }

    return vehicles.filter(
      (vehicle) =>
        getVehicleType(vehicle) ===
        normalizeType(filterVehicleType)
    );
  }, [vehicles, filterVehicleType]);

  // ==================================================
  // SELECTED VEHICLE TYPE
  // ==================================================

  const selectedVehicleType =
    selectedVehicle
      ? getVehicleType(selectedVehicle)
      : "";

  // ==================================================
  // VISIBLE SLOTS
  // ==================================================

  const visibleSlots = useMemo(() => {
    if (!selectedVehicleType) {
      return slots;
    }

    return slots.filter((slot) => {
      const slotType = normalizeType(
        slot.vehicle_type
      );

      return (
        !slotType ||
        slotType === selectedVehicleType
      );
    });
  }, [slots, selectedVehicleType]);

  // ==================================================
  // VALID TIME
  // ==================================================

  const hasValidTimeRange = Boolean(
    date &&
      startTime &&
      endTime &&
      startTime < endTime
  );

  // ==================================================
  // CHECK SLOT AVAILABILITY
  // ==================================================

  const isSlotAvailable = (slot) => {
    if (
      normalizeStatus(slot.status) !==
      "available"
    ) {
      return false;
    }

    if (!hasValidTimeRange) {
      return false;
    }

    const alreadyBooked =
      bookings.some((booking) => {
        const sameSlot =
          booking.slot_id != null
            ? String(booking.slot_id) ===
              String(slot.id)
            : String(booking.slot_number) ===
                String(slot.slot_number) &&
              String(
                booking.parking_lot || ""
              ).trim() ===
                String(
                  lot?.name || ""
                ).trim();

        const sameDate =
          String(
            booking.booking_date
          ).slice(0, 10) ===
          String(date);

        const confirmed =
          normalizeStatus(
            booking.status
          ) === "confirmed";

        const validBookingTime =
          booking.start_time &&
          booking.end_time;

        if (
          !sameSlot ||
          !sameDate ||
          !confirmed ||
          !validBookingTime
        ) {
          return false;
        }

        return timesOverlap(
          startTime,
          endTime,
          String(
            booking.start_time
          ).slice(0, 5),
          String(
            booking.end_time
          ).slice(0, 5)
        );
      });

    return !alreadyBooked;
  };

  const availableSlots =
    visibleSlots.filter(
      isSlotAvailable
    );

  // ==================================================
  // DURATION
  // ==================================================

  const durationMinutes = (() => {
    if (
      !startTime ||
      !endTime
    ) {
      return 0;
    }

    const [
      startHour,
      startMinute,
    ] = startTime
      .split(":")
      .map(Number);

    const [
      endHour,
      endMinute,
    ] = endTime
      .split(":")
      .map(Number);

    const start =
      startHour * 60 +
      startMinute;

    const end =
      endHour * 60 +
      endMinute;

    return end > start
      ? end - start
      : 0;
  })();

  // ==================================================
  // BILLING
  // ==================================================

  const billedHours =
    durationMinutes > 0
      ? Math.ceil(
          durationMinutes / 60
        )
      : 0;

  const pricePerHour = Number(
    selectedSlot?.price_per_hour || 0
  );

  const estimatedPrice =
    billedHours *
    pricePerHour;

  // ==================================================
  // VEHICLE HELPERS
  // ==================================================

  const vehicleName = (vehicle) =>
    vehicle?.name ||
    vehicle?.vehicle_name ||
    `${vehicle?.vehicle_type || "Vehicle"}`;

  const vehicleNumber = (vehicle) =>
    vehicle?.vehicle_number ||
    vehicle?.registration_number ||
    vehicle?.number ||
    "No number";

  const vehicleType = (vehicle) =>
    vehicle?.vehicle_type ||
    vehicle?.type ||
    vehicle?.category ||
    "";

  // ==================================================
  // DATE VALIDATION
  // ==================================================

  const validateDate = () => {
    if (!date) {
      setError(
        "Please select a date."
      );

      return false;
    }

    if (date < localToday()) {
      setError(
        "Booking date cannot be in the past."
      );

      return false;
    }

    return true;
  };

  // ==================================================
  // GO TO STEP
  // ==================================================

  const goToStep = (nextStep) => {
    setError("");
    setStep(nextStep);
  };

  // ==================================================
  // VEHICLE NEXT
  // ==================================================

  const handleVehicleNext = () => {
    setError("");

    if (
      filterVehicleType &&
      compatibleVehicles.length === 0
    ) {
      setError(
        "No compatible vehicle found. Please add a vehicle first."
      );

      return;
    }

    if (
      compatibleVehicles.length > 0 &&
      !selectedVehicle
    ) {
      setError(
        "Please select a vehicle."
      );

      return;
    }

    goToStep(2);
  };

  // ==================================================
  // DATE NEXT
  // ==================================================

  const handleDateNext = () => {
    if (!validateDate()) {
      return;
    }

    goToStep(3);
  };

  // ==================================================
  // TIME NEXT
  // ==================================================

  const handleTimeNext = () => {
    setError("");

    if (
      !startTime ||
      !endTime
    ) {
      setError(
        "Please select start and end time."
      );

      return;
    }

    if (startTime >= endTime) {
      setError(
        "End time must be after start time."
      );

      return;
    }

    goToStep(4);
  };

  // ==================================================
  // SLOT NEXT
  // ==================================================

  const handleSlotNext = () => {
    setError("");

    if (!selectedSlot) {
      setError(
        "Please select an available parking slot."
      );

      return;
    }

    if (
      !isSlotAvailable(
        selectedSlot
      )
    ) {
      setError(
        "This slot is no longer available for the selected time."
      );

      return;
    }

    goToStep(5);
  };

  // ==================================================
  // WAIT FOR RAZORPAY
  // ==================================================

  const waitForRazorpay = () => {
    return new Promise(
      (resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }

        let attempts = 0;

        const interval =
          setInterval(() => {
            attempts += 1;

            if (window.Razorpay) {
              clearInterval(interval);
              resolve();
              return;
            }

            if (attempts >= 30) {
              clearInterval(interval);

              reject(
                new Error(
                  "Razorpay payment system could not be loaded."
                )
              );
            }
          }, 200);
      }
    );
  };

  // ==================================================
  // OPEN RAZORPAY
  // ==================================================

  const openRazorpayPayment = async ({
    order,
    booking,
  }) => {
    await waitForRazorpay();

    const options = {
      key:
        order?.key_id ||
        paymentData?.key_id,

      amount:
        order?.amount ||
        Math.round(
          estimatedPrice * 100
        ),

      currency:
        order?.currency || "INR",

      name: "ParkEase",

      description:
        `Parking Booking - ${
          lot?.name || "Parking"
        }`,

      order_id:
        order?.id,

      prefill: {
        name:
          "ParkEase User",
      },

      theme: {
        color: "#2563eb",
      },

      modal: {
        ondismiss: () => {
          setPaymentLoading(false);

          setError(
            "Payment was cancelled. Your booking is still pending payment."
          );
        },
      },

      handler: async (
        razorpayResponse
      ) => {
        try {
          setPaymentLoading(true);
          setError("");

          const verification =
            await verifyPayment({
              razorpay_order_id:
                razorpayResponse.razorpay_order_id,

              razorpay_payment_id:
                razorpayResponse.razorpay_payment_id,

              razorpay_signature:
                razorpayResponse.razorpay_signature,

              booking_id:
                booking?.id ||
                booking?.booking_id,
            });

          const confirmedBooking =
            verification?.booking ||
            booking;

          setSuccessData({
            ...confirmedBooking,

            booking_id:
              confirmedBooking?.booking_id ||
              confirmedBooking?.id ||
              booking?.id,

            amount:
              confirmedBooking?.amount ??
              confirmedBooking?.total_amount ??
              estimatedPrice,
          });

          setStep(7);
        } catch (err) {
          console.error(
            "Payment verification error:",
            err
          );

          setError(
            err?.message ||
              "Payment verification failed."
          );
        } finally {
          setPaymentLoading(false);
        }
      },
    };

    const razorpay =
      new window.Razorpay(
        options
      );

    razorpay.on(
      "payment.failed",
      (response) => {
        console.error(
          "Razorpay payment failed:",
          response
        );

        setPaymentLoading(false);

        setError(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
      }
    );

    razorpay.open();
  };

  // ==================================================
  // CREATE BOOKING + PAYMENT
  // ==================================================

  const handleConfirm = async () => {
    setError("");

    if (!selectedSlot) {
      setError(
        "Please select a slot."
      );

      return;
    }

    if (
      !date ||
      !startTime ||
      !endTime
    ) {
      setError(
        "Please complete booking details."
      );

      return;
    }

    if (startTime >= endTime) {
      setError(
        "End time must be after start time."
      );

      return;
    }

    if (
      compatibleVehicles.length > 0 &&
      !selectedVehicle
    ) {
      setError(
        "Please select a vehicle."
      );

      return;
    }

    if (
      !isSlotAvailable(
        selectedSlot
      )
    ) {
      setError(
        "This slot is no longer available."
      );

      return;
    }

    if (estimatedPrice <= 0) {
      setError(
        "Invalid booking amount."
      );

      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------------
      // 1. CREATE PENDING BOOKING
      // -----------------------------------------------

      const response =
        await createBooking(
          selectedSlot.id,
          date,
          startTime,
          endTime,
          selectedVehicle?.id ??
            null
        );

      const booking =
        response?.booking ||
        response?.data ||
        response ||
        {};

      const bookingId =
        booking?.id ||
        booking?.booking_id ||
        response?.booking_id ||
        response?.id;

      if (!bookingId) {
        throw new Error(
          "Booking ID was not returned by the server."
        );
      }

      // -----------------------------------------------
      // 2. CREATE RAZORPAY ORDER
      // -----------------------------------------------

      const payment =
        await createPaymentOrder(
          bookingId,
          estimatedPrice
        );

      if (!payment?.order?.id) {
        throw new Error(
          "Unable to create payment order."
        );
      }

      setPaymentData(payment);

      // -----------------------------------------------
      // 3. MOVE TO PAYMENT STEP
      // -----------------------------------------------

      setStep(6);

      // -----------------------------------------------
      // 4. OPEN RAZORPAY
      // -----------------------------------------------

      await openRazorpayPayment({
        order: {
          ...payment.order,
          key_id:
            payment.key_id,
        },

        booking: {
          ...booking,
          id: bookingId,
        },
      });
    } catch (err) {
      console.error(
        "Booking/payment error:",
        err
      );

      if (err?.status === 409) {
        setError(
          "This slot was just booked by someone else. Please select another slot."
        );
      } else {
        setError(
          err?.message ||
            "Unable to start payment."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // PROGRESS
  // ==================================================

  const renderProgress = () => {
    if (step === 7) {
      return null;
    }

    return (
      <div className="booking-flow-progress">
        {[1, 2, 3, 4, 5, 6].map(
          (item) => (
            <div
              key={item}
              className={`booking-flow-progress-step ${
                step >= item
                  ? "active"
                  : ""
              }`}
            >
              <span>
                {item}
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  // ==================================================
  // STEP TITLE
  // ==================================================

  const renderStepTitle = () => {
    const titles = {
      1: "Select Vehicle",
      2: "Select Date",
      3: "Select Time",
      4: "Select Parking Slot",
      5: "Review Booking",
      6: "Make Payment",
      7: "Booking Confirmed",
    };

    return (
      <div className="booking-flow-heading">
        <div>
          <p className="booking-flow-step-label">
            STEP{" "}
            {step <= 6
              ? step
              : 7}{" "}
            OF 7
          </p>

          <h2>
            {titles[step]}
          </h2>

          <p>
            {lot?.name ||
              "Parking Location"}
          </p>
        </div>
      </div>
    );
  };

  // ==================================================
  // VEHICLE STEP
  // ==================================================

  const renderVehicleStep = () => {
    if (vehicleLoading) {
      return (
        <div className="booking-flow-loading">
          Loading vehicles...
        </div>
      );
    }

    if (
      compatibleVehicles.length ===
      0
    ) {
      return (
        <div className="booking-flow-empty-state">
          <div className="booking-flow-empty-icon">
            🚗
          </div>

          <h3>
            No vehicle available
          </h3>

          <p>
            Add a vehicle to your
            account before making a
            parking booking.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.location.href =
                "/vehicles";
            }}
          >
            Add Vehicle
          </button>
        </div>
      );
    }

    return (
      <div className="booking-vehicle-list">
        {compatibleVehicles.map(
          (vehicle) => {
            const selected =
              selectedVehicle?.id ===
              vehicle.id;

            return (
              <button
                type="button"
                key={vehicle.id}
                className={`booking-vehicle-card ${
                  selected
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedVehicle(
                    vehicle
                  );

                  setError("");
                }}
              >
                <div className="booking-vehicle-icon">
                  {getVehicleIcon(
                    vehicle
                  )}
                </div>

                <div className="booking-vehicle-info">
                  <strong>
                    {vehicleName(
                      vehicle
                    )}
                  </strong>

                  <span>
                    {vehicleNumber(
                      vehicle
                    )}
                  </span>

                  <small>
                    {vehicleType(
                      vehicle
                    )}
                  </small>
                </div>

                <div className="booking-radio">
                  {selected
                    ? "✓"
                    : ""}
                </div>
              </button>
            );
          }
        )}
      </div>
    );
  };

  // ==================================================
  // DATE STEP
  // ==================================================

  const renderDateStep = () => {
    return (
      <div className="booking-step-content">
        <div className="booking-date-card">
          <div className="booking-step-icon">
            📅
          </div>

          <div>
            <h3>
              Choose your parking date
            </h3>

            <p>
              Select the day you want
              to park.
            </p>
          </div>
        </div>

        <label className="booking-field">
          <span>
            Date
          </span>

          <input
            type="date"
            min={localToday()}
            value={date}
            onChange={(e) => {
              setDate(
                e.target.value
              );

              setError("");
            }}
          />
        </label>
      </div>
    );
  };

  // ==================================================
  // TIME STEP
  // ==================================================

  const renderTimeStep = () => {
    return (
      <div className="booking-step-content">
        <div className="booking-time-grid">
          <label className="booking-field">
            <span>
              Start Time
            </span>

            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(
                  e.target.value
                );

                setError("");
              }}
            />
          </label>

          <label className="booking-field">
            <span>
              End Time
            </span>

            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(
                  e.target.value
                );

                setError("");
              }}
            />
          </label>
        </div>

        {durationMinutes > 0 && (
          <div className="booking-duration-card">
            <span>
              Parking Duration
            </span>

            <strong>
              {Math.floor(
                durationMinutes /
                  60
              )}{" "}
              hr{" "}
              {durationMinutes % 60}{" "}
              min
            </strong>
          </div>
        )}
      </div>
    );
  };

  // ==================================================
  // SLOT STEP
  // ==================================================

  const renderSlotStep = () => {
    return (
      <div className="booking-step-content">
        <div className="booking-slot-summary">
          <div>
            <span>
              Date
            </span>

            <strong>
              {date}
            </strong>
          </div>

          <div>
            <span>
              Time
            </span>

            <strong>
              {startTime} –{" "}
              {endTime}
            </strong>
          </div>

          <div>
            <span>
              Available
            </span>

            <strong>
              {
                availableSlots.length
              }{" "}
              slots
            </strong>
          </div>
        </div>

        {visibleSlots.length ===
        0 ? (
          <div className="booking-flow-empty-state">
            <div className="booking-flow-empty-icon">
              🅿️
            </div>

            <h3>
              No slots available
            </h3>

            <p>
              There are no slots
              matching the selected
              vehicle.
            </p>
          </div>
        ) : (
          <div className="booking-slot-grid-flow">
            {visibleSlots.map(
              (slot) => (
                <ParkingSlot
                  key={slot.id}
                  slot={slot}
                  isSelected={
                    selectedSlot?.id ===
                    slot.id
                  }
                  isAvailable={isSlotAvailable(
                    slot
                  )}
                  onSelect={
                    setSelectedSlot
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================================================
  // REVIEW STEP
  // ==================================================

  const renderReviewStep = () => {
    return (
      <div className="booking-review">
        <div className="booking-review-card">
          <div className="booking-review-row">
            <span>
              Parking Location
            </span>

            <strong>
              {lot?.name}
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Parking Slot
            </span>

            <strong>
              {
                selectedSlot?.slot_number
              }
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Vehicle
            </span>

            <strong>
              {selectedVehicle
                ? vehicleNumber(
                    selectedVehicle
                  )
                : "No vehicle"}
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Date
            </span>

            <strong>
              {date}
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Time
            </span>

            <strong>
              {startTime} –{" "}
              {endTime}
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Duration
            </span>

            <strong>
              {billedHours} hour
              {billedHours !== 1
                ? "s"
                : ""}
            </strong>
          </div>

          <div className="booking-review-divider" />

          <div className="booking-review-total">
            <span>
              Total Amount
            </span>

            <strong>
              ₹
              {estimatedPrice.toFixed(
                2
              )}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  // ==================================================
  // PAYMENT STEP
  // ==================================================

  const renderPaymentStep = () => {
    return (
      <div className="booking-step-content">
        <div className="booking-review-card">
          <div className="booking-review-row">
            <span>
              Parking
            </span>

            <strong>
              {lot?.name}
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Slot
            </span>

            <strong>
              {
                selectedSlot?.slot_number
              }
            </strong>
          </div>

          <div className="booking-review-row">
            <span>
              Duration
            </span>

            <strong>
              {billedHours} hour
              {billedHours !== 1
                ? "s"
                : ""}
            </strong>
          </div>

          <div className="booking-review-divider" />

          <div className="booking-review-total">
            <span>
              Amount to Pay
            </span>

            <strong>
              ₹
              {estimatedPrice.toFixed(
                2
              )}
            </strong>
          </div>
        </div>

        <div className="booking-flow-empty-state">
          <div className="booking-flow-empty-icon">
            💳
          </div>

          <h3>
            Complete Payment
          </h3>

          <p>
            Your booking is waiting for
            payment. Complete the Razorpay
            payment to confirm your parking
            slot.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              try {
                setError("");
                setPaymentLoading(true);

                await openRazorpayPayment({
                  order:
                    paymentData?.order,
                  booking:
                    paymentData?.booking,
                });
              } catch (err) {
                console.error(
                  "Payment opening error:",
                  err
                );

                setError(
                  err?.message ||
                    "Unable to open payment."
                );
              } finally {
                setPaymentLoading(false);
              }
            }}
            disabled={paymentLoading}
          >
            {paymentLoading
              ? "Opening Payment..."
              : `Pay ₹${estimatedPrice.toFixed(
                  2
                )}`}
          </button>
        </div>
      </div>
    );
  };

  // ==================================================
  // SUCCESS STEP
  // ==================================================

  const renderSuccessStep = () => {
    const bookingId =
      successData?.booking_id ||
      successData?.id ||
      "Confirmed";

    const amount =
      Number(
        successData?.amount ??
          successData?.total_amount ??
          estimatedPrice
      ) || 0;

    return (
      <div className="booking-success">
        <div className="booking-success-icon">
          ✓
        </div>

        <h2>
          Booking Successful!
        </h2>

        <p>
          Payment successful and your
          parking slot has been confirmed.
        </p>

        <div className="booking-success-ticket">
          <div>
            <span>
              Booking ID
            </span>

            <strong>
              #{bookingId}
            </strong>
          </div>

          <div>
            <span>
              Parking
            </span>

            <strong>
              {lot?.name}
            </strong>
          </div>

          <div>
            <span>
              Slot
            </span>

            <strong>
              {
                selectedSlot?.slot_number
              }
            </strong>
          </div>

          <div>
            <span>
              Date
            </span>

            <strong>
              {date}
            </strong>
          </div>

          <div>
            <span>
              Time
            </span>

            <strong>
              {startTime} –{" "}
              {endTime}
            </strong>
          </div>

          <div>
            <span>
              Amount
            </span>

            <strong>
              ₹
              {amount.toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="booking-success-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onBooked?.();
            }}
          >
            Done
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.location.href =
                "/bookings";
            }}
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  };

  // ==================================================
  // MAIN MODAL
  // ==================================================

  return (
    <div className="booking-flow-overlay">
      <div
        className={`booking-flow-modal ${
          step === 7
            ? "booking-flow-success-modal"
            : ""
        }`}
      >
        {/* TOP BAR */}

        <div className="booking-flow-topbar">
          <div>
            <span className="booking-flow-location">
              {lot?.name}
            </span>
          </div>

          <button
            type="button"
            className="booking-flow-close"
            onClick={onClose}
            aria-label="Close booking"
          >
            ×
          </button>
        </div>

        {/* PROGRESS */}

        {renderProgress()}

        {/* TITLE */}

        {renderStepTitle()}

        {/* ERROR */}

        {error && (
          <div className="booking-flow-error-message">
            {error}
          </div>
        )}

        {/* BODY */}

        <div className="booking-flow-body">
          {step === 1 &&
            renderVehicleStep()}

          {step === 2 &&
            renderDateStep()}

          {step === 3 &&
            renderTimeStep()}

          {step === 4 &&
            renderSlotStep()}

          {step === 5 &&
            renderReviewStep()}

          {step === 6 &&
            renderPaymentStep()}

          {step === 7 &&
            renderSuccessStep()}
        </div>

        {/* FOOTER */}

        {step !== 6 &&
          step !== 7 && (
            <div className="booking-flow-footer">
              {step > 1 && (
                <button
                  type="button"
                  className="btn-secondary booking-back-button"
                  onClick={() => {
                    setError("");

                    setStep(
                      (current) =>
                        current - 1
                    );
                  }}
                  disabled={
                    loading ||
                    paymentLoading
                  }
                >
                  Back
                </button>
              )}

              <div className="booking-footer-spacer" />

              {step === 1 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    handleVehicleNext
                  }
                >
                  Continue
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    handleDateNext
                  }
                >
                  Continue
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    handleTimeNext
                  }
                >
                  View Slots
                </button>
              )}

              {step === 4 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    handleSlotNext
                  }
                  disabled={!selectedSlot}
                >
                  Review Booking
                </button>
              )}

              {step === 5 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    handleConfirm
                  }
                  disabled={loading}
                >
                  {loading
                    ? "Creating Payment..."
                    : `Proceed to Payment • ₹${estimatedPrice.toFixed(
                        2
                      )}`}
                </button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default BookingModal;