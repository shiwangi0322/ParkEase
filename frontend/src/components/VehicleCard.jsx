import { VehicleTypeIcon, PencilIcon, TrashIcon } from "./Icons";

const COLOR_MAP = {
  white: "#f8fafc",
  silver: "#CBD5E1",
  grey: "#94A3B8",
  gray: "#94A3B8",
  black: "#0F172A",
  blue: "#2563EB",
  red: "#DC2626",
  green: "#16A34A",
  yellow: "#FBBF24",
  orange: "#F97316",
  brown: "#92400E",
  purple: "#7C3AED",
};

function getColorHex(colorStr) {
  if (!colorStr) return "#CBD5E1";

  return (
    COLOR_MAP[colorStr.toLowerCase()] ||
    "#CBD5E1"
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }) {
  const typeName = vehicle.vehicle_type
    ? vehicle.vehicle_type.charAt(0).toUpperCase() +
      vehicle.vehicle_type.slice(1)
    : "Unknown";

  const displayName =
    [vehicle.brand, vehicle.model]
      .filter(Boolean)
      .join(" ") || "Unknown Vehicle";

  return (
    <div className="vehicle-card">

      {/* Default Badge */}
      {vehicle.is_default && (
        <span className="vehicle-card-default-marker badge badge-default">
          Default
        </span>
      )}

      {/* Header */}
      <div className="vehicle-card-header">

        <div className="vehicle-icon-box">
          <VehicleTypeIcon
            type={vehicle.vehicle_type}
            size={22}
          />
        </div>

        <div className="vehicle-card-info">

          <div
            className="vehicle-card-name"
            title={displayName}
          >
            {displayName}
          </div>

          <div className="vehicle-card-number">
            {vehicle.vehicle_number}
          </div>

          <div
            className="vehicle-card-meta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <span className="badge badge-type">
              {typeName}
            </span>

            {vehicle.color && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: getColorHex(vehicle.color),
                    border:
                      "1px solid rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                />

                {vehicle.color.charAt(0).toUpperCase() +
                  vehicle.color.slice(1)}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="vehicle-card-actions">

        <button
          className="btn-secondary"
          style={{
            padding: "7px 14px",
            fontSize: 13,
          }}
          onClick={() => onEdit(vehicle)}
        >
          <PencilIcon />
          Edit
        </button>

        <button
          className="btn-danger"
          style={{
            padding: "7px 14px",
            fontSize: 13,
          }}
          onClick={() => onDelete(vehicle)}
        >
          <TrashIcon />
          Delete
        </button>

      </div>
    </div>
  );
}

export default VehicleCard;