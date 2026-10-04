import { useEffect, useState } from "react";
import { verifyVehicle } from "../services/api";

const VEHICLE_TYPES = [
  "car",
  "bike",
  "scooter",
  "auto",
];

const COLORS = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Blue",
  "Red",
  "Yellow",
  "Orange",
  "Brown",
  "Purple",
];

const COLOR_DOTS = {
  white: "#F8FAFC",
  black: "#0F172A",
  silver: "#CBD5E1",
  grey: "#94A3B8",
  blue: "#2563EB",
  red: "#DC2626",
  yellow: "#FACC15",
  orange: "#F97316",
  brown: "#92400E",
  purple: "#7C3AED",
};

const normalizeVehicleNumber = (value) => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
};

const isValidVehicleNumber = (value) => {
  const number = normalizeVehicleNumber(value);

  const normalNumberRegex =
    /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

  const bhSeriesRegex =
    /^[0-9]{2}BH[0-9]{4}[A-HJ-NP-Z]{1,2}$/;

  return (
    normalNumberRegex.test(number) ||
    bhSeriesRegex.test(number)
  );
};

function VehicleForm({
  initial = null,
  onSave,
  onCancel,
  saving,
}) {
  const [form, setForm] = useState({
    vehicle_type: initial?.vehicle_type || "car",
    vehicle_number: initial?.vehicle_number || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    color: initial?.color || "",
    is_default: initial?.is_default ?? false,
  });

  const [errors, setErrors] = useState({});

  /* ================================
     VEHICLE VERIFICATION STATE
  ================================= */

  const [verificationStatus, setVerificationStatus] =
    useState(
      initial?.verification_status === "verified"
        ? "verified"
        : "idle"
    );

  const [verificationMessage, setVerificationMessage] =
    useState("");

  const [verificationData, setVerificationData] =
    useState(
      initial?.verification_status === "verified"
        ? {
            verified: true,
            verification_status: "verified",
          }
        : null
    );

  /* ================================
     SYNC EDIT VEHICLE
  ================================= */

  useEffect(() => {
    setForm({
      vehicle_type: initial?.vehicle_type || "car",
      vehicle_number: initial?.vehicle_number || "",
      brand: initial?.brand || "",
      model: initial?.model || "",
      color: initial?.color || "",
      is_default: initial?.is_default ?? false,
    });

    if (
      initial?.verification_status ===
      "verified"
    ) {
      setVerificationStatus("verified");

      setVerificationData({
        verified: true,
        verification_status: "verified",
      });
    } else {
      setVerificationStatus("idle");
      setVerificationMessage("");
      setVerificationData(null);
    }

    setErrors({});
  }, [initial]);

  /* ================================
     GENERIC SETTER
  ================================= */

  const set = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: "",
    }));

    /*
      If vehicle number changes,
      previous verification is no longer valid.
    */
    if (key === "vehicle_number") {
      setVerificationStatus("idle");
      setVerificationMessage("");
      setVerificationData(null);
    }
  };

  /* ================================
     VEHICLE NUMBER CHANGE
  ================================= */

  const handleVehicleNumberChange = (value) => {
    const formattedValue = value
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "");

    set(
      "vehicle_number",
      formattedValue
    );
  };

  /* ================================
     VERIFY VEHICLE
  ================================= */

  const handleVerifyVehicle = async () => {
    const normalizedNumber =
      normalizeVehicleNumber(
        form.vehicle_number
      );

    if (!normalizedNumber) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        vehicle_number:
          "Government vehicle registration number is required.",
      }));

      return;
    }

    if (
      !isValidVehicleNumber(
        normalizedNumber
      )
    ) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        vehicle_number:
          "Please enter a valid Indian vehicle registration number.",
      }));

      return;
    }

    try {
      setErrors((currentErrors) => ({
        ...currentErrors,
        vehicle_number: "",
      }));

      setVerificationStatus("checking");
      setVerificationMessage("");
      setVerificationData(null);

      const data =
        await verifyVehicle(
          normalizedNumber
        );

      if (data?.verified === true) {
        setVerificationStatus(
          "verified"
        );

        setVerificationData(data);

        setVerificationMessage(
          data.message ||
            "Vehicle registration verified."
        );
      } else {
        setVerificationStatus(
          "failed"
        );

        setVerificationData(data);

        setVerificationMessage(
          data?.message ||
            "Vehicle registration could not be verified."
        );
      }
    } catch (error) {
      setVerificationStatus(
        "failed"
      );

      setVerificationData(
        error?.data || null
      );

      setVerificationMessage(
        error?.data?.message ||
          error?.message ||
          "Vehicle verification failed."
      );
    }
  };

  /* ================================
     VALIDATION
  ================================= */

  const validate = () => {
    const errs = {};

    const normalizedNumber =
      normalizeVehicleNumber(
        form.vehicle_number
      );

    if (!form.vehicle_type) {
      errs.vehicle_type =
        "Vehicle type is required.";
    }

    if (!normalizedNumber) {
      errs.vehicle_number =
        "Government vehicle registration number is required.";
    } else if (
      !isValidVehicleNumber(
        normalizedNumber
      )
    ) {
      errs.vehicle_number =
        "Please enter a valid Indian vehicle registration number.";
    } else if (
      verificationStatus !== "verified"
    ) {
      errs.vehicle_number =
        "Please verify the vehicle registration number before saving.";
    }

    return errs;
  };

  /* ================================
     SUBMIT
  ================================= */

  const handleSubmit = (e) => {
    e.preventDefault();

    const errs = validate();

    if (
      Object.keys(errs).length > 0
    ) {
      setErrors(errs);
      return;
    }

    const normalizedVehicleNumber =
      normalizeVehicleNumber(
        form.vehicle_number
      );

    onSave({
      vehicle_type:
        form.vehicle_type,

      vehicle_number:
        normalizedVehicleNumber,

      brand:
        form.brand.trim() ||
        undefined,

      model:
        form.model.trim() ||
        undefined,

      color:
        form.color.toLowerCase() ||
        undefined,

      is_default:
        form.is_default,

      /*
        Send verification information
        along with the vehicle.
      */
      verification_status:
        verificationStatus,

      verification_source:
        verificationData?.verification_source ||
        undefined,

      verified_at:
        verificationData?.verified_at ||
        undefined,
    });
  };

  const isEdit = Boolean(initial);

  return (
    <div
      className="form-modal-overlay"
      onClick={onCancel}
    >
      <div
        className="form-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* ================================
            TITLE
        ================================= */}

        <div className="form-modal-title">
          {isEdit
            ? "Edit Vehicle"
            : "Add Vehicle"}
        </div>

        <div className="form-modal-subtitle">
          {isEdit
            ? "Update your vehicle details."
            : "Add a new vehicle to make bookings faster."}
        </div>

        <form
          onSubmit={handleSubmit}
        >
          {/* ================================
              VEHICLE TYPE
          ================================= */}

          <div className="form-group">
            <label className="field-label">
              Vehicle Type
            </label>

            <select
              className="field-input"
              value={
                form.vehicle_type
              }
              onChange={(e) =>
                set(
                  "vehicle_type",
                  e.target.value
                )
              }
              disabled={isEdit}
            >
              {VEHICLE_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type
                      .charAt(0)
                      .toUpperCase() +
                      type.slice(1)}
                  </option>
                )
              )}
            </select>

            {errors.vehicle_type && (
              <div className="error-text">
                {errors.vehicle_type}
              </div>
            )}
          </div>

          {/* ================================
              REGISTRATION NUMBER
          ================================= */}

          <div className="form-group">
            <label className="field-label">
              Government Registration Number
            </label>

            <input
              type="text"
              className="field-input"
              value={
                form.vehicle_number
              }
              onChange={(e) =>
                handleVehicleNumberChange(
                  e.target.value
                )
              }
              placeholder="e.g. MH12AB1234"
              maxLength={15}
              autoComplete="off"
            />

            <div
              style={{
                fontSize: 12,
                color:
                  "var(--text-muted)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Enter the vehicle
              registration number exactly
              as shown on the RC.
            </div>

            <div
              style={{
                fontSize: 12,
                color:
                  "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Examples: MH12AB1234,
              DL01CA1234, 22BH1234AA
            </div>

            {/* ================================
                VERIFY BUTTON
            ================================= */}

            <button
              type="button"
              className="btn-secondary"
              onClick={
                handleVerifyVehicle
              }
              disabled={
                verificationStatus ===
                "checking"
              }
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {verificationStatus ===
              "checking"
                ? "Verifying..."
                : "Verify Vehicle"}
            </button>

            {/* ================================
                VERIFIED MESSAGE
            ================================= */}

            {verificationStatus ===
              "verified" && (
              <p
                style={{
                  color: "#15803D",
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                ✓ Vehicle registration
                verified
              </p>
            )}

            {/* ================================
                FAILED MESSAGE
            ================================= */}

            {verificationStatus ===
              "failed" && (
              <p
                style={{
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                ✕{" "}
                {verificationMessage}
              </p>
            )}

            {/* ================================
                CHECKING MESSAGE
            ================================= */}

            {verificationStatus ===
              "checking" && (
              <p
                style={{
                  color:
                    "var(--text-muted)",
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                Checking vehicle
                registration...
              </p>
            )}

            {errors.vehicle_number && (
              <div className="error-text">
                {errors.vehicle_number}
              </div>
            )}
          </div>

          {/* ================================
              BRAND + MODEL
          ================================= */}

          <div className="form-row">
            <div className="form-group">
              <label className="field-label">
                Brand
              </label>

              <input
                type="text"
                className="field-input"
                value={form.brand}
                onChange={(e) =>
                  set(
                    "brand",
                    e.target.value
                  )
                }
                placeholder="e.g. Hyundai"
              />
            </div>

            <div className="form-group">
              <label className="field-label">
                Model
              </label>

              <input
                type="text"
                className="field-input"
                value={form.model}
                onChange={(e) =>
                  set(
                    "model",
                    e.target.value
                  )
                }
                placeholder="e.g. i20"
              />
            </div>
          </div>

          {/* ================================
              COLOR
          ================================= */}

          <div className="form-group">
            <label className="field-label">
              Color
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <select
                className="field-input"
                value={form.color}
                onChange={(e) =>
                  set(
                    "color",
                    e.target.value
                  )
                }
                style={{
                  flex: 1,
                }}
              >
                <option value="">
                  Select color
                </option>

                {COLORS.map(
                  (color) => (
                    <option
                      key={color}
                      value={color}
                    >
                      {color}
                    </option>
                  )
                )}
              </select>

              {form.color && (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    minWidth: 22,
                    borderRadius:
                      "50%",
                    background:
                      COLOR_DOTS[
                        form.color.toLowerCase()
                      ],
                    border:
                      "1px solid rgba(15,23,42,0.12)",
                    display:
                      "inline-block",
                  }}
                />
              )}
            </div>
          </div>

          {/* ================================
              DEFAULT VEHICLE
          ================================= */}

          <div
            className="form-group"
            style={{
              marginTop: 14,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={
                  form.is_default
                }
                onChange={(e) =>
                  set(
                    "is_default",
                    e.target.checked
                  )
                }
              />

              Set as default vehicle
            </label>
          </div>

          {/* ================================
              ACTIONS
          ================================= */}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={
                saving ||
                verificationStatus !==
                  "verified"
              }
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Vehicle"
                : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleForm;