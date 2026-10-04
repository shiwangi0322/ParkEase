/**
 * Haversine distance in kilometers between two lat/lng points.
 * Returns null (never a fabricated number) if any coordinate is missing
 * or not a finite number.
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const a1 = Number(lat1), o1 = Number(lng1), a2 = Number(lat2), o2 = Number(lng2);
  if (![a1, o1, a2, o2].every(Number.isFinite)) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(a2 - a1);
  const dLng = toRad(o2 - o1);
  const lat1Rad = toRad(a1);
  const lat2Rad = toRad(a2);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}

/** Formats a km distance for display; returns null if input is null. */
export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** True only if both coordinates are present and numeric — never assumed. */
export function hasValidCoords(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}
