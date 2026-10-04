/**
 * All pricing shown in the UI is derived from the real `price_per_hour`
 * column on the `slots` table (via GET /api/slots) — nothing is hardcoded
 * here. These are pure helpers so every screen computes rates the same way.
 */

/** Slots belonging to a specific lot. */
export function slotsForLot(slots, lotId) {
  if (!lotId) return [];
  return slots.filter((s) => String(s.lot_id) === String(lotId));
}

/** Lowest real price_per_hour among the given slots, or null if none priced. */
export function lowestRate(slots) {
  const priced = slots.map((s) => Number(s.price_per_hour)).filter((p) => Number.isFinite(p) && p > 0);
  if (priced.length === 0) return null;
  return Math.min(...priced);
}

/** Lowest real price_per_hour for a specific vehicle type, or null. */
export function rateForType(slots, vehicleType) {
  return lowestRate(slots.filter((s) => s.vehicle_type === vehicleType));
}

/**
 * { car, bike, scooter } -> lowest real rate for each type present in this
 * lot's slots, or null for types this lot doesn't have. Never invents a
 * price for a type that doesn't exist in the data.
 */
export function ratesByType(slots) {
  const types = [...new Set(slots.map((s) => s.vehicle_type).filter(Boolean))];
  const rates = {};
  for (const t of types) rates[t] = rateForType(slots, t);
  return rates;
}
