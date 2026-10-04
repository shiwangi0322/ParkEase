import { MapPinIcon } from "./Icons";
import { getParkingImage } from "../data/parkingImages";

/**
 * Presentational card for one parking lot on the Explore screen.
 *
 * Does NOT calculate availability, price, or distance — all of that
 * comes from Explore.jsx (`stats`, `distance`), which already derives it
 * from the real /api/lots and /api/slots data. This component only
 * renders what it's given.
 *
 * Accessibility: the outer element is a <article> with a click/keyboard
 * handler (role="button"), and "View Details" is a real, separate
 * <button> — never a button nested inside another button.
 */
function ParkingCard({ lot, stats, distance, onClick }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  const hasAvailability = stats && typeof stats.available === "number";
  const isAvailable = hasAvailability && stats.available > 0;

  return (
    <article
      className="parking-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${lot.name}`}
    >
      <div className="parking-card-image-wrap">
        <img
          src={getParkingImage(lot)}
          alt={lot.name}
          className="parking-card-image"
          loading="lazy"
        />
      </div>

      <div className="parking-card-body">
        <h3 className="parking-card-name">{lot.name}</h3>

        <div className="parking-card-location">
          <MapPinIcon size={12} />
          <span>{lot.address || lot.location}</span>
          {distance != null && <span className="parking-card-distance">· {distance}</span>}
        </div>

        <div className="parking-card-footer">
          <div className="parking-card-meta">
            {hasAvailability && (
              <span className={`parking-card-availability-badge${isAvailable ? "" : " parking-card-availability-badge-full"}`}>
                {isAvailable ? `${stats.available} slots` : "Full"}
              </span>
            )}
            <div className="parking-card-price">
              {stats?.price != null ? (
                <>
                  <span className="parking-card-price-value">₹{stats.price}</span>
                  <span className="parking-card-price-unit">/hr</span>
                </>
              ) : (
                <span className="parking-card-price-unit">Rate unavailable</span>
              )}
            </div>
          </div>

          <button className="btn-secondary parking-card-details-btn" onClick={handleDetailsClick}>
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default ParkingCard;