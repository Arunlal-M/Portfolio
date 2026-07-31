import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import { smoother } from './Navbar';
import "./styles/Career.css";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const EXPS = [
  {
    id: 1,
    period: "2024",
    periodEnd: "2026",
    type: "Full-Time",
    location: "Globify",
    company: "Globify Software Solutions",
    role: "Full Stack Developer",
    bullets: [
      "Architected scalable, real-time enterprise platforms using Node.js, Express 5, and Django.",
      "Established PCI-compliant payment gateways, containerized services with Docker/AWS, and provisioned infrastructure using Terraform."
    ],
    tech: ["Node.js", "Express", "Django", "Docker", "AWS", "Terraform"]
  },
  {
    id: 2,
    period: "2023",
    periodEnd: "2024",
    type: "Internship",
    location: "MashupStack",
    company: "MashupStack",
    role: "Full Stack Intern",
    bullets: [
      "Crafted responsive React frontends and Django REST Framework backends for live production workflows.",
      "Enhanced PostgreSQL/MySQL schemas, reducing API response latency by 40%."
    ],
    tech: ["React", "Django REST", "PostgreSQL", "MySQL"]
  },
  {
    id: 3,
    period: "2019",
    periodEnd: "2023",
    type: "Education",
    location: "Kariavattom",
    company: "University College of Engineering",
    role: "B.Tech in Computer Science",
    bullets: [
      "Completed Bachelor of Technology in Computer Science and Engineering.",
      "Laid a strong foundation in software development, data structures, algorithms, and system design."
    ],
    tech: ["Data Structures", "Algorithms", "System Design"]
  }
];

const Career = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const blinkerRef = useRef<HTMLDivElement>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualScrollRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const pinWrap = pinWrapRef.current;
    const track = trackRef.current;
    const blinker = blinkerRef.current;
    
    if (!section || !pinWrap || !track || !blinker) return;

    // Get track scroll amount to move horizontally
    const getScrollAmount = () => {
      // Calculate exactly how much to scroll to align the last card to the left edge
      const cards = track.querySelectorAll('.career-card-container');
      if (cards.length > 0) {
        const cardWidth = cards[0].getBoundingClientRect().width;
        return -(cardWidth * (cards.length - 1));
      }
      
      let trackWidth = track.scrollWidth;
      // Use parent container's width, which handles the right side
      const containerWidth = track.parentElement?.clientWidth || window.innerWidth;
      return -(trackWidth - containerWidth);
    };

    // Initialize ScrollTrigger timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin: pinWrap,
        start: "top top",
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        scrub: 1,
        snap: {
          snapTo: (value: number) => {
            // During programmatic scrolling, disable snap to prevent it
            // from fighting the tween (snap detects residual velocity and
            // pushes to the wrong adjacent snap point)
            if (isManualScrollRef.current) return value;
            return Math.round(value * (EXPS.length - 1)) / (EXPS.length - 1);
          },
          duration: 0.3
        },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setIsScrolling(true);
          setScrollProgress(self.progress);
          
          if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
          scrollTimeout.current = setTimeout(() => {
            setIsScrolling(false);
          }, 150);

          const numCards = EXPS.length;
          // Progress goes from 0 to 1
          const newIndex = Math.round(self.progress * (numCards - 1));
          setActiveIndex(newIndex);
        }
      }
    });

    // Animate the cards moving horizontally
    tl.to(track, {
      x: getScrollAmount,
      ease: "none"
    }, 0);

    // Animate the blinker dot moving from top to bottom along the vertical timeline
    tl.to(blinker, {
      top: "100%",
      ease: "none"
    }, 0);

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === section) t.kill();
      });
    };
  }, []);

  const handleDotClick = (index: number) => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || !smoother) return;

    // smoother.offset() returns the scroll position in the coordinate system
    // that properly accounts for ScrollSmoother's speed setting (1.7x).
    const sectionStart = smoother.offset(section, "top top");

    // The pin scroll range matches the ScrollTrigger end callback.
    const scrollRange = track.scrollWidth - window.innerWidth;

    const progress = index / (EXPS.length - 1);
    const targetScroll = sectionStart + progress * scrollRange;

    // Disable snap during the programmatic scroll to prevent it from
    // detecting tween velocity and pushing to the wrong snap point
    isManualScrollRef.current = true;

    // Kill any in-progress scroll tween
    gsap.killTweensOf(smoother);

    gsap.to(smoother, {
      scrollTop: targetScroll,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        // Wait for ScrollSmoother to fully settle before re-enabling snap
        setTimeout(() => {
          isManualScrollRef.current = false;
        }, 250);
      }
    });
  };

  return (
    <section ref={sectionRef} className="career-section section-container" id="career">
      <div className="career-pin-wrap" ref={pinWrapRef}>
        
        <div className="career-header">
          <h2 className="career-label">
            WORK <span className="do-h2">EXPERIENCE</span>
          </h2>
          <span className="career-labelRight">0{EXPS.length} Stages</span>
        </div>

        <div className="career-body-row">
          {/* Vertical Timeline */}
          <div className="career-timeline-container">
            <div className="career-timelineBody">
              <div className="career-snakeLine" />
              <div className="career-timeline-dots">
                {EXPS.map((exp, i) => {
                  const isActive = activeIndex === i;
                  const targetProgress = i / (EXPS.length - 1);
                  const distance = Math.abs(scrollProgress - targetProgress);
                  
                  // Only pulse when the blinker is very close to this number
                  // e.g., within 12% of the total timeline scroll length
                  const isPulsing = isActive && distance < 0.06;
                  const topPos = targetProgress * 100;
                  
                  return (
                    <div
                      key={exp.id}
                      className={`career-timeline-number ${isActive ? 'active' : ''} ${isPulsing ? 'pulsing' : ''}`}
                      style={{ top: `${topPos}%` }}
                      onClick={() => handleDotClick(i)}
                    >
                      0{i + 1}
                    </div>
                  );
                })}
                <div
                  ref={blinkerRef}
                  className={`career-blinker-dot blinking`}
                  style={{ opacity: isScrolling ? 1 : 0 }}
                />
              </div>
            </div>
          </div>

          {/* Carousel Viewport */}
          <div className="career-carousel-viewport">
            <div className="career-carousel-track" ref={trackRef}>
              {EXPS.map((exp) => (
                <div key={exp.id} className="career-card-container">
                  <div className="career-card">
                    <div className="career-cardHead">
                      <span className="career-period">{exp.period} - {exp.periodEnd}</span>
                      <span className="career-typeTag">{exp.type}</span>
                      {exp.location && <span className="career-location">{exp.location}</span>}
                    </div>
                    <h2 className="career-company">{exp.company}</h2>
                    <p className="career-role">{exp.role}</p>
                    <ul className="career-bullets">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="career-bullet">{b}</li>
                      ))}
                    </ul>
                    <div className="career-stack">
                      {exp.tech.map(t => (
                        <span key={t} className="career-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Career;
