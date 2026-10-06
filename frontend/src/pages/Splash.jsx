import { useNavigate } from "react-router-dom";

import parkingScene from "../assets/parking-scene.png";

import "./Splash.css";

function Splash() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/login");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // stop Space from scrolling the page
      if (!event.repeat) goToLogin();
    }
  };

  return (
    <main
      className="park-splash"
      onClick={goToLogin}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label="Open ParkEase and continue to login"
    >
      <section className="park-splash-frame">
        {/* Soft background light */}
        <div className="park-glow park-glow-blue" aria-hidden="true" />
        <div className="park-glow park-glow-yellow" aria-hidden="true" />
        <div className="park-grid" aria-hidden="true" />

        {/* ================= TOP SECTION ================= */}
        <header className="park-top">
          <div className="park-logo-row park-reveal" style={{ "--i": 0 }}>
            {/* P logo mark */}
            <svg
              className="park-logo-mark"
              viewBox="0 0 126 146"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <clipPath id="park-logo-clip">
                  <path d="M14 6H64C92 6 112 26 112 52C112 78 92 98 64 98H46V126C46 132 42 136 36 136H24C18 136 14 132 14 126Z" />
                </clipPath>
                <linearGradient id="park-logo-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1D6BF0" />
                  <stop offset="1" stopColor="#0B4FD6" />
                </linearGradient>
              </defs>

              {/* Blue P with white counter */}
              <path
                d="M14 6H64C92 6 112 26 112 52C112 78 92 98 64 98H46V126C46 132 42 136 36 136H24C18 136 14 132 14 126Z M46 28H62C73 28 82 38 82 52C82 66 73 76 62 76H46Z"
                fill="url(#park-logo-grad)"
                fillRule="evenodd"
              />

              {/* Yellow accent stripe */}
              <g clipPath="url(#park-logo-clip)">
                <polygon points="8,100 52,80 52,96 8,118" fill="#F5A623" />
              </g>

              {/* Car icon in the counter */}
              <g
                fill="none"
                stroke="#0B5CE6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M52 56l3.5-9.5h17L76 56" />
                <rect x="49.5" y="56" width="29" height="11" rx="3.5" />
              </g>
              <circle cx="56" cy="61.5" r="1.7" fill="#0B5CE6" />
              <circle cx="72" cy="61.5" r="1.7" fill="#0B5CE6" />

              {/* Bike icon on the stem */}
              <g
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="22.5" cy="123" r="3.6" />
                <circle cx="37.5" cy="123" r="3.6" />
                <path d="M22.5 123l5-7h6l4 7M27.5 116l-1.5-2.5" />
              </g>
            </svg>

            <div className="park-wordmark">
              <h1 className="park-title">
                Park<em>Ease</em>
              </h1>
              <p className="park-tagline">
                Find <b>•</b> Reserve <b>•</b> Park
              </p>
            </div>
          </div>

          <p className="park-subtitle park-reveal" style={{ "--i": 1 }}>
            <span>Smart Parking</span> for a Smoother Ride
          </p>

          <ul className="park-features park-reveal" style={{ "--i": 2 }}>
            <li className="park-feature">
              <span className="park-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <span className="park-feature-text">
                Real-Time
                <br />
                Availability
              </span>
            </li>

            <li className="park-feature">
              <span className="park-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span className="park-feature-text">
                Secure
                <br />
                Booking
              </span>
            </li>

            <li className="park-feature">
              <span className="park-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <span className="park-feature-text">
                Nearby
                <br />
                Locations
              </span>
            </li>
          </ul>
        </header>

        {/* ================= PARKING SCENE ================= */}
        <div className="park-scene park-reveal-scene">
          <img
            src={parkingScene}
            alt="A red car, a motorbike and a scooter parked in marked bays at a ParkEase parking lot"
            className="park-scene-img"
            draggable="false"
          />

          {/* Live availability chip */}
          <div className="park-live" aria-hidden="true">
            <span className="park-live-dot" />
            Live availability
          </div>

          {/* Call to action (whole screen is clickable) */}
          <div className="park-cta" aria-hidden="true">
            <span>Tap anywhere to get started</span>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Splash;