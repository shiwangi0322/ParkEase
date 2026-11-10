import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import carImage from "../assets/CAR.png";
import bikeImage from "../assets/bike.png";
import scooterImage from "../assets/SCOOTER.png";
import "./Splash.css";

const rides = [
  { name: "Car", image: carImage, alt: "Red car" },
  { name: "Motorbike", image: bikeImage, alt: "Black motorbike" },
  { name: "Scooter", image: scooterImage, alt: "White electric scooter" },
];

function Splash() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="ParkEase home">
          <span className="landing-brand-mark" aria-hidden="true">P</span>
          <span className="landing-brand-name">
            Park<span>Ease</span>
          </span>
        </Link>

        <div className="landing-header-actions">
          <Link className="landing-login-link" to="/login">
            Log in
          </Link>
          <Link className="landing-header-cta" to="/register">
            Sign up <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <span className="landing-eyebrow">YOUR NEXT STOP STARTS HERE</span>
          <h1 id="landing-title">
            Parking, <span>made easy.</span>
          </h1>
          <p>Find a spot. Book ahead. Go.</p>
        </div>

        <div className="landing-scene" aria-label="Parking for every kind of ride">
          <div className="landing-sky-orb landing-sky-orb-left" />
          <div className="landing-sky-orb landing-sky-orb-center" />
          <div className="landing-sky-orb landing-sky-orb-right" />
          <div className="landing-skyline" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
          <div className="landing-parking-floor" aria-hidden="true">
            <span className="landing-parking-line landing-parking-line-one" />
            <span className="landing-parking-line landing-parking-line-two" />
            <span className="landing-parking-line landing-parking-line-three" />
          </div>
          <div className="landing-pin" aria-hidden="true">
            <span>P</span>
          </div>
          <img
            src={carImage}
            alt="Red car"
            className="landing-vehicle landing-vehicle-car"
            fetchPriority="high"
          />
          <img
            src={bikeImage}
            alt="Black motorbike"
            className="landing-vehicle landing-vehicle-bike"
          />
          <img
            src={scooterImage}
            alt="White electric scooter"
            className="landing-vehicle landing-vehicle-scooter"
          />
        </div>
        <Link className="landing-primary-cta" to="/register">
          Get started <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section className="landing-rides" aria-label="Choose your ride">
        <div className="landing-rides-heading">
          <span>ONE EASY BOOKING</span>
          <h2>Every ride welcome.</h2>
        </div>
        <div className="landing-ride-list">
          {rides.map((ride) => (
            <Link
              className={`landing-ride-card landing-ride-card--${ride.name.toLowerCase()}`}
              key={ride.name}
              to="/register"
              aria-label={`Get started with your ${ride.name.toLowerCase()}`}
            >
              <span className="landing-ride-image">
                <img src={ride.image} alt={ride.alt} loading="lazy" />
              </span>
              <span className="landing-ride-name">{ride.name}</span>
              <ArrowRight
                className="landing-ride-arrow"
                size={17}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link className="landing-brand landing-footer-brand" to="/">
          <span className="landing-brand-mark" aria-hidden="true">P</span>
          <span className="landing-brand-name">
            Park<span>Ease</span>
          </span>
        </Link>
        <span>Park. Book. Go.</span>
        <Link className="landing-footer-link" to="/register">
          Sign up <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </main>
  );
}

export default Splash;
