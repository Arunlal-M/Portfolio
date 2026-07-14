import { PropsWithChildren } from "react";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              ARUN LAL M
            </h1>
          </div>
          <div className="landing-info">
            <h3>A Creative</h3>
            <h2 className="landing-info-domain-group">
              <div className="landing-domain-primary">FullStack</div>
              <div className="landing-domain-secondary">Software</div>
            </h2>
            <h2>
              <div className="landing-title-primary">Developer</div>
              <div className="landing-title-secondary">Engineer</div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
