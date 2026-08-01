import { MdArrowOutward, MdCopyright, MdEmail, MdPhone } from "react-icons/md";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-bg-watermark">CONTACT</div>
      
      <div className="contact-container">
        <div className="contact-header-wrap">
          <h2 className="contact-title">
            CONTACT <span className="do-h2">ME</span>
          </h2>
          <div className="contact-badge">
            <span className="status-dot"></span> Available for Opportunities
          </div>
        </div>

        <div className="contact-grid">
          {/* Card 1: Direct Contact */}
          <div className="contact-card">
            <h4>DIRECT CONTACT</h4>
            <div className="contact-item">
              <span className="contact-item-label">
                <MdEmail className="contact-icon" /> Email
              </span>
              <a href="mailto:arunlal.m2000@gmail.com" data-cursor="icons" className="contact-link">
                <span className="contact-text-inner">arunlal.m2000@gmail.com</span>
              </a>
            </div>
            <div className="contact-item">
              <span className="contact-item-label">
                <MdPhone className="contact-icon" /> Phone
              </span>
              <a href="tel:+918301073565" data-cursor="icons" className="contact-link">
                <span className="contact-text-inner">+91 8301073565</span>
              </a>
            </div>
          </div>

          {/* Card 2: Social Network */}
          <div className="contact-card">
            <h4>SOCIAL NETWORKS</h4>
            <div className="contact-social-list">
              <a
                href="https://github.com/Arunlal-M"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="icons"
                className="contact-social"
              >
                <span className="contact-text-inner">
                  <span>Github</span> <MdArrowOutward className="social-arrow" />
                </span>
              </a>
              <a
                href="https://linkedin.com/in/arun-lal-m"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="icons"
                className="contact-social"
              >
                <span className="contact-text-inner">
                  <span>Linkedin</span> <MdArrowOutward className="social-arrow" />
                </span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="icons"
                className="contact-social"
              >
                <span className="contact-text-inner">
                  <span>Twitter</span> <MdArrowOutward className="social-arrow" />
                </span>
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="icons"
                className="contact-social"
              >
                <span className="contact-text-inner">
                  <span>Instagram</span> <MdArrowOutward className="social-arrow" />
                </span>
              </a>
            </div>
          </div>

          {/* Card 3: Design & Credits */}
          <div className="contact-card contact-credit-card">
            <h4>CREATION & CREDITS</h4>
            <h3 className="credit-title">
              Designed &amp; Developed <br /> by <span>Arunlal M</span>
            </h3>
            <div className="contact-copyright">
              <MdCopyright /> 2026 Arunlal M. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
