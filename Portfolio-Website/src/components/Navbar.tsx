import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { HiOutlineMenuAlt4, HiOutlineX } from "react-icons/hi";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let idleTimeout: ReturnType<typeof setTimeout>;
    let isHoveringNav = false;

    let lastScrollY = 0;

    const hideNav = () => {
      if (isHoveringNav) return;
      gsap.to('.header, .header-glass-bg', { y: -150, duration: 0.5, ease: 'power2.out' });
    };

    const showNav = () => {
      gsap.to('.header, .header-glass-bg', { y: 0, duration: 0.5, ease: 'power2.out' });
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(hideNav, 1500);
    };

    const headerElem = document.querySelector('.header');
    const headerBg = document.querySelector('.header-glass-bg');
    if (headerElem && headerBg) {
      const enterHandler = () => {
        isHoveringNav = true;
        clearTimeout(idleTimeout);
        gsap.to('.header, .header-glass-bg', { y: 0, duration: 0.5, ease: 'power2.out' });
      };
      const leaveHandler = () => {
        isHoveringNav = false;
        idleTimeout = setTimeout(hideNav, 1500);
      };

      headerElem.addEventListener('mouseenter', enterHandler);
      headerElem.addEventListener('mouseleave', leaveHandler);
      headerBg.addEventListener('mouseenter', enterHandler);
      headerBg.addEventListener('mouseleave', leaveHandler);
    }

    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.7,
      speed: 1.7,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
      onUpdate: (self) => {
        const currentScrollY = self.scrollTop();
        if (currentScrollY <= 50) {
           clearTimeout(idleTimeout);
           gsap.to('.header, .header-glass-bg', { y: 0, duration: 0.5, ease: 'power2.out' });
        } else {
           if (currentScrollY > lastScrollY + 5) { // Scrolling DOWN
             hideNav();
           } else if (currentScrollY < lastScrollY - 5) { // Scrolling UP
             showNav();
           }
        }
        lastScrollY = currentScrollY;
      }
    });

    smoother.scrollTop(0);
    smoother.paused(true);

    let links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      let element = elem as HTMLAnchorElement;
      element.addEventListener("click", (e) => {
        if (window.innerWidth > 1024) {
          e.preventDefault();
          let elem = e.currentTarget as HTMLAnchorElement;
          let section = elem.getAttribute("data-href");
          smoother.scrollTo(section, true, "top top");
        }
      });
    });
    window.addEventListener("resize", () => {
      ScrollSmoother.refresh(true);
    });

    return () => clearTimeout(idleTimeout);
  }, []);

  return (
    <>
      <div className={`header-glass-bg ${isMenuOpen ? "menu-open" : ""}`}></div>
      <div className={`header ${isMenuOpen ? "menu-open" : ""}`}>
        <div className="header-inner">
          <a href="/#" className="navbar-title" data-cursor="icons">
          </a>
          <a
            href="mailto:arunlal.m2000@gmail.com"
            className="navbar-connect"
            data-cursor="icons"
          >
            arunlal.m2000@gmail.com
          </a>
          <div className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <HiOutlineX /> : <HiOutlineMenuAlt4 />}
          </div>
        </div>
        
        <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <li>
            <a data-href="#about" href="#about" data-cursor="icons" onClick={() => setIsMenuOpen(false)}>
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work" data-cursor="icons" onClick={() => setIsMenuOpen(false)}>
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact" data-cursor="icons" onClick={() => setIsMenuOpen(false)}>
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
