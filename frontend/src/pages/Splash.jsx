import { useNavigate } from "react-router-dom";
import car from "../assets/CAR.png";
import bike from "../assets/bike.png";
import cariee from "../assets/cariee.png";
import scooter from "../assets/SCOOTER.png";
import background from "../assets/hero.png";

function Splash() {
  const navigate = useNavigate();

  const goToLogin = () => navigate("/login");

  return (
    <div
      className="splash-page"
      style={{ "--splash-background": `url(${background})` }}
      onClick={goToLogin}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") goToLogin();
      }}
      role="link"
      tabIndex={0}
      aria-label="Open ParkEase"
    >
      <div className="splash-scene" aria-hidden="true">
        <div className="splash-logo-mark">P</div>

        <div className="splash-ambient-glow splash-ambient-glow-left" />
        <div className="splash-ambient-glow splash-ambient-glow-right" />

        <div className="splash-parking-floor">
          <span className="splash-parking-line splash-parking-line-one" />
          <span className="splash-parking-line splash-parking-line-two" />
          <span className="splash-parking-line splash-parking-line-three" />
          <span className="splash-location-marker" />
        </div>

        <div className="splash-vehicles">
          <img className="splash-vehicle splash-car" src={car} alt="" />
          <img className="splash-vehicle splash-car-secondary" src={cariee} alt="" />
          <img className="splash-vehicle splash-bike" src={bike} alt="" />
          <img className="splash-vehicle splash-scooter" src={scooter} alt="" />
        </div>
      </div>
    </div>
  );
}

export default Splash;
