import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ParkingMap.css";

import {
  hasValidCoords,
  distanceKm,
  formatDistance,
} from "../../utils/distance";

import { LocateIcon, NavigationIcon } from "../Icons";


// --------------------------------------------------
// GOOGLE DIRECTIONS
// --------------------------------------------------

function buildDirectionsUrl(lat, lng) {
  if (!hasValidCoords(lat, lng)) return null;

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}


// --------------------------------------------------
// LEAFLET DEFAULT ICON
// --------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// --------------------------------------------------
// USER LOCATION ICON
// --------------------------------------------------

const userIcon = new L.DivIcon({
  className: "parking-map-user-marker",

  html:
    '<span class="parking-map-user-dot"></span>',

  iconSize: [18, 18],

  iconAnchor: [9, 9],
});


// --------------------------------------------------
// EXTERNAL PARKING ICON
// --------------------------------------------------

const externalParkingIcon = new L.DivIcon({
  className: "parking-map-external-marker",

  html:
    `<div class="parking-map-external-pin">P</div>`,

  iconSize: [30, 38],

  iconAnchor: [15, 38],

  popupAnchor: [0, -30],
});


// --------------------------------------------------
// FIT USER LOCATION + PARKING LOCATION
// --------------------------------------------------

function FitParkingRoute({
  userPosition,
  destination,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !userPosition ||
      !destination ||
      !hasValidCoords(
        destination.latitude,
        destination.longitude
      )
    ) {
      return;
    }

    const parkingLat =
      Number(destination.latitude);

    const parkingLng =
      Number(destination.longitude);

    const userLat =
      Number(userPosition.lat);

    const userLng =
      Number(userPosition.lng);

    if (
      !Number.isFinite(userLat) ||
      !Number.isFinite(userLng) ||
      !Number.isFinite(parkingLat) ||
      !Number.isFinite(parkingLng)
    ) {
      return;
    }

    const bounds = L.latLngBounds([
      [userLat, userLng],
      [parkingLat, parkingLng],
    ]);

    map.fitBounds(bounds, {
      paddingTopLeft: [40, 80],
      paddingBottomRight: [40, 70],
      maxZoom: 15,
      animate: true,
    });

  }, [
    userPosition,
    destination,
    map,
  ]);

  return null;
}


// --------------------------------------------------
// PARKING ROUTE
// --------------------------------------------------

function ParkingRoute({
  userPosition,
  destination,
  onRouteInfo,
  onRouteLoading,
}) {
  const [routeCoordinates, setRouteCoordinates] =
    useState([]);

  useEffect(() => {
    if (
      !userPosition ||
      !destination ||
      !hasValidCoords(
        destination.latitude,
        destination.longitude
      )
    ) {
      setRouteCoordinates([]);

      onRouteInfo?.({
        distanceKm: null,
        durationMinutes: null,
      });

      onRouteLoading?.(false);

      return;
    }

    const controller = new AbortController();

    async function loadRoute() {
      try {
        onRouteLoading?.(true);

        const userLat =
          Number(userPosition.lat);

        const userLng =
          Number(userPosition.lng);

        const parkingLat =
          Number(destination.latitude);

        const parkingLng =
          Number(destination.longitude);

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${userLng},${userLat};${parkingLng},${parkingLat}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "Unable to calculate route."
          );
        }

        const data =
          await response.json();

        const route =
          data?.routes?.[0];

        // ------------------------------------------
        // NO ROUTE
        // ------------------------------------------

        if (!route) {
          setRouteCoordinates([]);

          onRouteInfo?.({
            distanceKm: null,
            durationMinutes: null,
          });

          throw new Error(
            "Unable to calculate route."
          );
        }

        const coordinates =
          route?.geometry?.coordinates;

        // ------------------------------------------
        // NO COORDINATES
        // ------------------------------------------

        if (
          !Array.isArray(coordinates) ||
          coordinates.length === 0
        ) {
          setRouteCoordinates([]);

          onRouteInfo?.({
            distanceKm: null,
            durationMinutes: null,
          });

          throw new Error(
            "Route coordinates unavailable."
          );
        }

        // ------------------------------------------
        // DISTANCE
        // ------------------------------------------

        const distanceInMeters =
          Number(route.distance);

        // ------------------------------------------
        // TIME
        // ------------------------------------------

        const durationInSeconds =
          Number(route.duration);

        // ------------------------------------------
        // DISTANCE + ETA
        // ------------------------------------------

        onRouteInfo?.({
          distanceKm:
            Number.isFinite(
              distanceInMeters
            )
              ? distanceInMeters / 1000
              : null,

          durationMinutes:
            Number.isFinite(
              durationInSeconds
            )
              ? Math.ceil(
                  durationInSeconds / 60
                )
              : null,
        });

        // ------------------------------------------
        // OSRM [lng, lat]
        // TO LEAFLET [lat, lng]
        // ------------------------------------------

        const leafletCoordinates =
          coordinates.map(
            ([lng, lat]) => [
              lat,
              lng,
            ]
          );

        setRouteCoordinates(
          leafletCoordinates
        );

      } catch (error) {
        if (
          error?.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Parking route error:",
          error
        );

        setRouteCoordinates([]);

        onRouteInfo?.({
          distanceKm: null,
          durationMinutes: null,
        });

      } finally {
        if (
          !controller.signal.aborted
        ) {
          onRouteLoading?.(false);
        }
      }
    }

    loadRoute();

    return () => {
      controller.abort();
    };

  }, [
    userPosition,
    destination,
    onRouteInfo,
    onRouteLoading,
  ]);

  if (
    !routeCoordinates.length
  ) {
    return null;
  }

  return (
    <>
      {/* WHITE ROUTE OUTLINE */}

      <Polyline
        positions={
          routeCoordinates
        }
        pathOptions={{
          color: "#FFFFFF",
          weight: 8,
          opacity: 0.9,
        }}
      />

      {/* BLUE ROAD ROUTE */}

      <Polyline
        positions={
          routeCoordinates
        }
        pathOptions={{
          color: "#2563EB",
          weight: 5,
          opacity: 0.95,
        }}
      />
    </>
  );
}


// ==================================================
// PARKING MAP
// ==================================================

function ParkingMap({ lots = [] }) {
  const [userPosition, setUserPosition] =
    useState(null);

  const [locating, setLocating] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [externalParking, setExternalParking] =
    useState([]);

  const [
    loadingExternalParking,
    setLoadingExternalParking,
  ] = useState(false);

  const [selectedLotId, setSelectedLotId] =
    useState(null);


  // -----------------------------------------------
  // ROUTE INFO
  // -----------------------------------------------

  const [routeInfo, setRouteInfo] =
    useState({
      distanceKm: null,
      durationMinutes: null,
    });

  const [routeLoading, setRouteLoading] =
    useState(false);


  // -----------------------------------------------
  // VALID LOTS
  // -----------------------------------------------

  const mappableLots = useMemo(
    () =>
      lots.filter((lot) =>
        hasValidCoords(
          lot.latitude,
          lot.longitude
        )
      ),

    [lots]
  );


  // -----------------------------------------------
  // MARKER ICON
  // -----------------------------------------------

  const createMarkerIcon =
    useCallback(
      (lot) => {
        const isSelected =
          String(lot.id) ===
          String(selectedLotId);

        return new L.DivIcon({
          className:
            "parking-map-lot-marker",

          html: `
            <div
              class="parking-map-lot-pin ${
                isSelected
                  ? "parking-map-lot-pin--selected"
                  : ""
              }"
            >
              P
            </div>
          `,

          iconSize: [34, 42],

          iconAnchor: [17, 42],

          popupAnchor: [0, -38],
        });
      },

      [selectedLotId]
    );


  // -----------------------------------------------
  // FETCH NEARBY PARKING
  // -----------------------------------------------

  const fetchNearbyParking =
    useCallback(
      async (
        latitude,
        longitude
      ) => {
        try {
          setLoadingExternalParking(
            true
          );

          const apiBase =
            import.meta.env.VITE_API_URL ||
            "http://localhost:5000";

          const response =
            await fetch(
              `${apiBase}/api/parking/nearby-parking?lat=${latitude}&lng=${longitude}`
            );

          if (!response.ok) {
            throw new Error(
              "Unable to load nearby parking"
            );
          }

          const data =
            await response.json();

          setExternalParking(
            Array.isArray(data)
              ? data
              : data?.parking || []
          );

        } catch (error) {
          console.error(
            "Nearby parking error:",
            error
          );

          setExternalParking([]);

        } finally {
          setLoadingExternalParking(
            false
          );
        }
      },

      []
    );


  // -----------------------------------------------
  // GET USER LOCATION
  // -----------------------------------------------

  const useMyLocation =
    useCallback(() => {
      if (
        !("geolocation" in navigator)
      ) {
        setLocationError(
          "Location is not supported by this browser."
        );

        return;
      }

      setLocating(true);

      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat:
              position.coords.latitude,

            lng:
              position.coords.longitude,
          };

          setUserPosition(
            location
          );

          fetchNearbyParking(
            location.lat,
            location.lng
          );

          setLocating(false);
        },

        (error) => {
          console.error(
            "Location error:",
            error
          );

          setLocating(false);

          setLocationError(
            "Unable to get your location. Please allow location access."
          );
        },

        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 0,
        }
      );
    }, [fetchNearbyParking]);


  // -----------------------------------------------
  // GET LOCATION ON LOAD
  // -----------------------------------------------

  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);


  // -----------------------------------------------
  // EMPTY MAP
  // -----------------------------------------------

  if (
    mappableLots.length === 0 &&
    !userPosition
  ) {
    return (
      <div
        className="parking-map-wrap"
        style={{
          minHeight: 280,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div className="empty-state">
          <p className="empty-state-title">
            Map location unavailable
          </p>

          <p className="text-caption">
            This parking location does not
            have valid coordinates.
          </p>
        </div>
      </div>
    );
  }


  // -----------------------------------------------
  // FIRST LOT
  // -----------------------------------------------

  const firstLot =
    mappableLots[0] || null;


  // -----------------------------------------------
  // INITIAL CENTER
  // -----------------------------------------------

  const initialCenter =
    firstLot
      ? [
          Number(
            firstLot.latitude
          ),

          Number(
            firstLot.longitude
          ),
        ]
      : userPosition
        ? [
            userPosition.lat,
            userPosition.lng,
          ]
        : [19.186, 72.857];


  // -----------------------------------------------
  // ROUTE DESTINATION
  // -----------------------------------------------

  const routeDestination =
    mappableLots.find(
      (lot) =>
        String(lot.id) ===
        String(selectedLotId)
    ) || firstLot;


  return (
    <div
      className="parking-map-wrap"
      style={{
        position: "relative",
      }}
    >

      {/* =================================================
          DISTANCE + ETA CARD
          ================================================= */}

      {userPosition &&
        routeDestination && (
          <div
            style={{
              position: "absolute",

              top: 12,

              left: 12,

              zIndex: 1000,

              background: "#FFFFFF",

              borderRadius: 12,

              padding:
                "10px 14px",

              boxShadow:
                "0 4px 16px rgba(0,0,0,0.16)",

              minWidth: 170,

              pointerEvents:
                "none",
            }}
          >

            <div
              style={{
                fontSize: 11,

                fontWeight: 600,

                color: "#6B7280",

                marginBottom: 4,
              }}
            >
              To{" "}
              {routeDestination.name}
            </div>


            {routeLoading ? (
              <div
                style={{
                  fontSize: 13,

                  fontWeight: 600,

                  color: "#374151",
                }}
              >
                Calculating route…
              </div>

            ) : routeInfo.distanceKm != null &&
              routeInfo.durationMinutes != null ? (

              <>
                <div
                  style={{
                    fontSize: 17,

                    fontWeight: 750,

                    color: "#111827",
                  }}
                >
                  🚗{" "}

                  {routeInfo.distanceKm <
                  1
                    ? `${Math.round(
                        routeInfo.distanceKm *
                          1000
                      )} m`
                    : `${routeInfo.distanceKm.toFixed(
                        1
                      )} km`}
                </div>


                <div
                  style={{
                    marginTop: 3,

                    fontSize: 13,

                    fontWeight: 600,

                    color: "#6B7280",
                  }}
                >
                  ⏱️ About{" "}
                  {
                    routeInfo.durationMinutes
                  }{" "}
                  min
                </div>
              </>

            ) : (

              <div
                style={{
                  fontSize: 13,

                  fontWeight: 600,

                  color: "#6B7280",
                }}
              >
                Route unavailable
              </div>
            )}

          </div>
        )}


      {/* =================================================
          MAP
          ================================================= */}

      <MapContainer
        center={initialCenter}

        zoom={14}

        scrollWheelZoom={true}

        style={{
          width: "100%",

          height: "100%",

          minHeight: 320,
        }}
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* ---------------------------------------------
            PARK EASE PARKING LOTS
            --------------------------------------------- */}

        {mappableLots.map(
          (lot) => {
            const lat =
              Number(
                lot.latitude
              );

            const lng =
              Number(
                lot.longitude
              );

            const directionsUrl =
              buildDirectionsUrl(
                lat,
                lng
              );

            return (
              <Marker
                key={lot.id}

                position={[
                  lat,
                  lng,
                ]}

                icon={
                  createMarkerIcon(
                    lot
                  )
                }

                eventHandlers={{
                  click: () => {
                    setSelectedLotId(
                      lot.id
                    );
                  },
                }}
              >

                <Popup>

                  <div
                    style={{
                      minWidth: 180,
                    }}
                  >

                    <strong>
                      {lot.name}
                    </strong>


                    <div
                      style={{
                        marginTop: 4,

                        fontSize: 12,

                        color:
                          "#6B7280",
                      }}
                    >
                      {lot.address ||
                        lot.location}
                    </div>


                    {directionsUrl && (
                      <a
                        href={
                          directionsUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        style={{
                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          gap: 5,

                          marginTop: 8,

                          fontSize: 12,

                          fontWeight: 600,
                        }}
                      >
                        <NavigationIcon
                          size={13}
                        />

                        Get Directions
                      </a>
                    )}

                  </div>

                </Popup>

              </Marker>
            );
          }
        )}


        {/* ---------------------------------------------
            EXTERNAL PARKING
            --------------------------------------------- */}

        {externalParking.map(
          (
            parking,
            index
          ) => {

            const lat =
              Number(
                parking.latitude ??
                  parking.lat
              );

            const lng =
              Number(
                parking.longitude ??
                  parking.lng
              );

            if (
              !Number.isFinite(
                lat
              ) ||
              !Number.isFinite(
                lng
              )
            ) {
              return null;
            }

            const name =
              parking.name ||
              "Nearby Parking";

            const address =
              parking.address ||
              parking.vicinity ||
              "";

            const directionsUrl =
              buildDirectionsUrl(
                lat,
                lng
              );

            return (
              <Marker
                key={
                  parking.id ||
                  parking.place_id ||
                  `${lat}-${lng}-${index}`
                }

                position={[
                  lat,
                  lng,
                ]}

                icon={
                  externalParkingIcon
                }
              >

                <Popup>

                  <div
                    style={{
                      minWidth: 170,
                    }}
                  >

                    <strong>
                      {name}
                    </strong>


                    {address && (
                      <div
                        style={{
                          marginTop: 4,

                          fontSize: 12,

                          color:
                            "#6B7280",
                        }}
                      >
                        {address}
                      </div>
                    )}


                    {directionsUrl && (
                      <a
                        href={
                          directionsUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        style={{
                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          gap: 5,

                          marginTop: 8,

                          fontSize: 12,

                          fontWeight: 600,
                        }}
                      >
                        <NavigationIcon
                          size={13}
                        />

                        Directions
                      </a>
                    )}

                  </div>

                </Popup>

              </Marker>
            );
          }
        )}


        {/* ---------------------------------------------
            USER LOCATION
            --------------------------------------------- */}

        {userPosition && (
          <Marker
            position={[
              userPosition.lat,
              userPosition.lng,
            ]}

            icon={userIcon}
          >
            <Popup>
              Your current location
            </Popup>
          </Marker>
        )}


        {/* ---------------------------------------------
            BLUE ROAD ROUTE
            --------------------------------------------- */}

        {userPosition &&
          routeDestination && (
            <ParkingRoute
              userPosition={
                userPosition
              }

              destination={
                routeDestination
              }

              onRouteInfo={
                setRouteInfo
              }

              onRouteLoading={
                setRouteLoading
              }
            />
          )}


        {/* ---------------------------------------------
            FIT BOTH LOCATIONS
            --------------------------------------------- */}

        {userPosition &&
          routeDestination && (
            <FitParkingRoute
              userPosition={
                userPosition
              }

              destination={
                routeDestination
              }
            />
          )}

      </MapContainer>


      {/* =================================================
          USE MY LOCATION BUTTON
          ================================================= */}

      <button
        type="button"

        onClick={
          useMyLocation
        }

        disabled={locating}

        aria-label="Use my location"

        style={{
          position:
            "absolute",

          right: 12,

          bottom: 12,

          zIndex: 1000,

          display:
            "inline-flex",

          alignItems:
            "center",

          gap: 6,

          padding:
            "9px 12px",

          border: "none",

          borderRadius: 10,

          background:
            "#FFFFFF",

          color:
            "#111827",

          fontSize: 12,

          fontWeight: 700,

          cursor: locating
            ? "wait"
            : "pointer",

          boxShadow:
            "0 4px 14px rgba(0,0,0,0.16)",
        }}
      >

        <LocateIcon size={15} />

        {locating
          ? "Locating…"
          : "Use my location"}

      </button>


      {/* =================================================
          NEARBY PARKING LOADING
          ================================================= */}

      {loadingExternalParking && (
        <div
          style={{
            position:
              "absolute",

            top: 92,

            left: 12,

            zIndex: 1000,

            padding:
              "7px 10px",

            borderRadius: 9,

            background:
              "#FFFFFF",

            boxShadow:
              "0 4px 14px rgba(0,0,0,0.12)",

            fontSize: 11,

            fontWeight: 600,

            color:
              "#6B7280",
          }}
        >
          Finding nearby parking…
        </div>
      )}


      {/* =================================================
          LOCATION ERROR
          ================================================= */}

      {locationError && (
        <div
          style={{
            position:
              "absolute",

            left: 12,

            right: 12,

            bottom: 12,

            zIndex: 999,

            padding:
              "9px 12px",

            borderRadius: 10,

            background:
              "#FFFFFF",

            boxShadow:
              "0 4px 14px rgba(0,0,0,0.12)",

            fontSize: 12,

            fontWeight: 600,

            color:
              "#B91C1C",
          }}
        >
          {locationError}
        </div>
      )}

    </div>
  );
}

export default ParkingMap;