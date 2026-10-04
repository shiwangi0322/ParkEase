import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ParkingMap from "../components/map/ParkingMap";
import ParkingCard from "../components/ParkingCard";
import { SearchIcon } from "../components/Icons";
import { getLots, getSlots } from "../services/api";
import { distanceKm, formatDistance, hasValidCoords } from "../utils/distance";
import { slotsForLot, lowestRate } from "../utils/pricing";
import "./Explore.css";

const FILTERS = [
  { id: "nearby", label: "Nearby" },
  { id: "available", label: "Available" },
  { id: "price", label: "Price: Low to High" },
];

function Explore() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [userPosition, setUserPosition] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [lotsData, slotsData] = await Promise.all([getLots(), getSlots()]);
      setLots(Array.isArray(lotsData) ? lotsData : []);
      setSlots(Array.isArray(slotsData) ? slotsData : []);
    } catch {
      setError("Unable to load parking locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silent — distance is simply not shown if unavailable
    );
  }, []);

  // Derive per-lot availability/price from the real /api/slots response —
  // same data ParkingSlotGrid already uses — nothing invented.
  const lotStats = useMemo(() => {
    const map = new Map();
    for (const lot of lots) {
      const lotSlots = slotsForLot(slots, lot.id);
      const available = lotSlots.filter((s) => s.status === "available").length;
      const price = lowestRate(lotSlots); // starting price = lowest real rate, not first match
      map.set(String(lot.id), {
        total: lot.total_slots ?? lotSlots.length,
        available,
        price,
      });
    }
    return map;
  }, [lots, slots]);

  const results = useMemo(() => {
    let list = [...lots];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((lot) =>
        [lot.name, lot.location, lot.address].filter(Boolean).some((f) => f.toLowerCase().includes(q))
      );
    }

    if (activeFilter === "available") {
      list = list.filter((lot) => (lotStats.get(String(lot.id))?.available ?? 0) > 0);
    }
    if (activeFilter === "price") {
      list = [...list].sort((a, b) => {
        const pa = lotStats.get(String(a.id))?.price ?? Infinity;
        const pb = lotStats.get(String(b.id))?.price ?? Infinity;
        return pa - pb;
      });
    }
    if (activeFilter === "nearby" && userPosition) {
      list = [...list].sort((a, b) => {
        const da = distanceKm(userPosition.lat, userPosition.lng, a.latitude, a.longitude) ?? Infinity;
        const db = distanceKm(userPosition.lat, userPosition.lng, b.latitude, b.longitude) ?? Infinity;
        return da - db;
      });
    }
    return list;
  }, [lots, query, activeFilter, userPosition, lotStats]);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div style={{ marginBottom: 24 }}>
          <h1 className="text-page-title">Explore Parking</h1>
          <p className="text-secondary" style={{ marginTop: 4 }}>
            Search and browse all parking locations, then reserve a slot.
          </p>
        </div>

        {/* Search */}
        <div className="explore-search">
          <SearchIcon size={16} />
          <input
            className="explore-search-input"
            placeholder="Search parking name or location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search parking lots"
          />
        </div>

        {/* Filter chips */}
        <div className="explore-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`explore-filter-chip${activeFilter === f.id ? " explore-filter-chip-active" : ""}`}
              onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="slot-grid" style={{ marginTop: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <p className="empty-state-title" style={{ color: "var(--error)" }}>Unable to load parking locations</p>
            <p className="empty-state-body">{error}</p>
            <button className="btn-primary" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="explore-layout">
            <div className="explore-layout-list">
              <p className="text-caption" style={{ marginBottom: 12 }}>
                {results.length} parking location{results.length === 1 ? "" : "s"}
              </p>

              {results.length === 0 && (
                <div className="empty-state">
                  <p className="empty-state-title">No parking locations found</p>
                  <p className="empty-state-body">Try a different search term or filter.</p>
                </div>
              )}

              <div className="explore-list">
                {results.map((lot) => {
                  const stats = lotStats.get(String(lot.id));
                  const km =
                    userPosition && hasValidCoords(lot.latitude, lot.longitude)
                      ? distanceKm(userPosition.lat, userPosition.lng, lot.latitude, lot.longitude)
                      : null;
                  return (
                    <ParkingCard
                      key={lot.id}
                      lot={lot}
                      stats={stats}
                      distance={km != null ? formatDistance(km) : null}
                      onClick={() => navigate(`/parking/${lot.id}`)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="explore-layout-map">
              <ParkingMap
                lots={results}
                statsByLotId={lotStats}
                onViewParking={(lot) => navigate(`/parking/${lot.id}`)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Explore;