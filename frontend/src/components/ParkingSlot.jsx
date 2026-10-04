import { CheckIcon, VehicleTypeIcon } from "./Icons";

function ParkingSlot({ slot, isSelected, isAvailable, onSelect }) {
  const isDisabled  = !isAvailable;

  let cardClass = "slot-card";
  let textColor = "var(--text-secondary)";

  if (isSelected) {
    cardClass += " slot-card-selected";
    textColor  = "var(--primary)";
  } else if (isAvailable) {
    cardClass += " slot-card-available";
    textColor  = "var(--success)";
  } else {
    cardClass += " slot-card-booked";
    textColor  = "var(--text-muted)";
  }

  return (
    <button
      className={cardClass}
      onClick={() => isAvailable && onSelect(slot)}
      disabled={isDisabled}
      aria-label={`Slot ${slot.slot_number} — ${isSelected ? "selected" : isAvailable ? "available" : "booked"}`}
      aria-pressed={isSelected}
      style={{ color: textColor }}
    >
      {isSelected && (
        <span className="slot-card-check">
          <CheckIcon size={8} />
        </span>
      )}

      <span className="slot-card-vehicle-icon">
        {isAvailable || isSelected ? <VehicleTypeIcon type={slot.vehicle_type} size={20} /> : "🔒"}
      </span>
      <span className="slot-card-number">{slot.slot_number}</span>

      {slot.vehicle_type && (
        <span className="slot-card-type">{slot.vehicle_type}</span>
      )}

      <span className="slot-card-status">
        {isSelected ? "Selected" : isAvailable ? "Available" : "Booked"}
      </span>
    </button>
  );
}

export default ParkingSlot;
