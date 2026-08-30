import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { MdCopyright, MdEmail, MdPhone } from "react-icons/md";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./styles/Contact.css";
import { EarthCanvas, StarsCanvas } from "./canvas";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  useGSAP(() => {
    gsap.fromTo(
      ".contact-form-container",
      { x: -100, opacity: 0 },
      { 
        x: 0, 
        opacity: 1, 
        duration: 1, 
        ease: "power3.out", 
        scrollTrigger: { 
          trigger: containerRef.current, 
          start: "top 80%" 
        } 
      }
    );
    gsap.fromTo(
      ".contact-earth-container",
      { x: 100, opacity: 0 },
      { 
        x: 0, 
        opacity: 1, 
        duration: 1, 
        ease: "power3.out", 
        scrollTrigger: { 
          trigger: containerRef.current, 
          start: "top 80%" 
        } 
      }
    );
  }, { scope: containerRef });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { target } = e;
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    emailjs
      .send(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          to_name: "Arunlal",
          from_email: form.email,
          to_email: "arunlal.m2000@gmail.com",
          message: form.message,
        },
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setLoading(false);
          alert("Thank you. I will get back to you as soon as possible.");

          setForm({
            name: "",
            email: "",
            message: "",
          });
        },
        (error) => {
          setLoading(false);
          console.error(error);
          alert("Ahh, something went wrong. Please try again.");
        }
      );
  };

  return (
    <div className="contact-section section-container" id="contact" ref={containerRef} style={{ position: 'relative', zIndex: 0 }}>
      <StarsCanvas />
      
      {/* <div className="contact-bg-watermark">CONTACT</div> */}
      
      <div className="contact-container">
        <div className="contact-header-wrap">
          <h2 className="contact-title">
            CONTACT <span className="do-h2">ME</span>
          </h2>
          <div className="contact-badge">
            <span className="status-dot"></span> Available for Opportunities
          </div>
        </div>

        <div className="contact-layout">
          <div className="contact-form-container">
            <p className="contact-sub-text">Get in touch</p>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="contact-form"
            >
              <label className="contact-form-label">
                <span>Your Name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="What's your good name?"
                  className="contact-form-input"
                />
              </label>
              <label className="contact-form-label">
                <span>Your email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="What's your web address?"
                  className="contact-form-input"
                />
              </label>
              <label className="contact-form-label">
                <span>Your Message</span>
                <textarea
                  rows={4}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="What you want to say?"
                  className="contact-form-input"
                />
              </label>

              <button
                type="submit"
                className="contact-form-submit"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>

          <div className="contact-earth-container">
            <EarthCanvas />
          </div>
        </div>

        {/* Merged Cards */}
        <div className="contact-merged-card">
          <div className="contact-merged-column">
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

          <div className="contact-merged-column contact-credit-card">
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
