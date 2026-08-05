import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles/Work.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const PROJECTS = [
  {
    id: 1,
    title: "ISRO-VSSC Portal",
    subtitle: "QA Workflow Engine",
    type: "Web Application",
    desc: "A comprehensive QA workflow engine built for ISRO-VSSC. Features an automated PDF generation system using WeasyPrint and a robust Django backend.",
    tech: ["Python", "Django", "WeasyPrint"],
    image: "/images/work/VSSC.png",
    link: "https://vssc.globify.in/"
  },
  {
    id: 2,
    title: "Smana Al Raffa Hotel",
    subtitle: "Booking Platform",
    type: "Full Stack",
    desc: "A multi-platform booking system offering seamless reservations, real-time availability sync via Socket.IO, and a Flutter mobile application.",
    tech: ["Next.js", "Strapi", "Express", "Flutter", "Socket.IO"],
    image: "/images/work/SMANA.png",
    link: "https://smanahotels.com/"
  },
  {
    id: 3,
    title: "TRINS School Portal",
    subtitle: "Web Application",
    type: "Frontend",
    desc: "An interactive portal for TRINS School utilizing advanced Framer Motion and GSAP animations for a modern user experience.",
    tech: ["Next.js", "Framer Motion", "GSAP"],
    image: "/images/work/TRINS.png",
    link: "#"
  },
  {
    id: 4,
    title: "YouTube Video Translator",
    subtitle: "AI-Powered App",
    type: "AI / ML",
    desc: "An innovative application that leverages the Google Gemini LLM API to automatically translate and summarize YouTube videos.",
    tech: ["Streamlit", "Gemini LLM API", "SQLite"],
    image: "/images/work/YT_TRANSALTOR.png",
    link: "https://youtubetranslator.streamlit.app/"
  },
  {
    id: 5,
    title: "DevOps Infrastructure",
    subtitle: "Cloud Architecture",
    type: "DevOps",
    desc: "Architected a scalable, containerized microservices infrastructure using Docker and Kubernetes, provisioned via Terraform on AWS.",
    tech: ["Docker", "AWS ECR", "Kubernetes", "Terraform"],
    image: "/images/placeholder.webp",
    link: "#"
  }
];

export default function Work() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])
  const bgRefs      = useRef<(HTMLDivElement | null)[]>([])
  const counterRef  = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [, setSlideIdx] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const track   = trackRef.current
    if (!section || !track) return

    const n = PROJECTS.length
    contentRefs.current = contentRefs.current.slice(0, n)
    bgRefs.current      = bgRefs.current.slice(0, n)

    // Slides 2+ hidden initially
    contentRefs.current.forEach((el, i) => {
      if (el && i > 0) gsap.set(el, { opacity: 0, y: 30 })
    })

    const tl = gsap.timeline({ paused: true })

    // Horizontal slide - xPercent is viewport-independent
    tl.to(track, {
      xPercent: -((n - 1) / n * 100),
      ease: 'none',
      duration: n - 1,
    }, 0)

    for (let i = 0; i < n - 1; i++) {
      const curr   = contentRefs.current[i]
      const next   = contentRefs.current[i + 1]
      const nextBg = bgRefs.current[i + 1]

      if (curr) {
        tl.to(curr, {
          opacity: 0, y: -40, filter: 'blur(6px)',
          duration: 0.2, ease: 'power2.in',
        }, i + 0.30)
      }

      if (nextBg) {
        tl.fromTo(nextBg,
          { scale: 1.04 },
          { scale: 1.0, duration: 1.0, ease: 'power2.out' },
          i
        )
      }

      if (next) {
        tl.set(next, { opacity: 1, y: 0 }, i + 0.44)
        const meta  = next.querySelector(`.work-meta`)
        const title = next.querySelector(`.work-title`)
        const sub   = next.querySelector(`.work-subtitle`)
        const desc  = next.querySelector(`.work-desc`)
        const tags  = next.querySelectorAll(`.work-tag`)
        const btn   = next.querySelector(`.work-liveBtn`)

        if (meta)  tl.fromTo(meta,  { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, i + 0.45)
        if (title) tl.fromTo(title, { opacity: 0, y: 20 },  { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out'   }, i + 0.48)
        if (sub)   tl.fromTo(sub,   { y: 12, opacity: 0 },  { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out' }, i + 0.54)
        if (desc)  tl.fromTo(desc,  { y: 10, opacity: 0 },  { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, i + 0.58)
        if (tags.length) {
          tl.fromTo(tags,  { y: 6, opacity: 0 },  { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out', stagger: 0.03 }, i + 0.65)
        }
        if (btn)   tl.fromTo(btn,   { y: 8, opacity: 0 },  { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out' }, i + 0.72)
      }
    }

    const st = ScrollTrigger.create({
      trigger:  section,
      start:    'top top',
      end:      () => `+=${(n - 1) * window.innerHeight}`,
      pin:      true,
      snap: {
        snapTo: 1 / (n - 1),
        delay: 0,
        duration: { min: 0.2, max: 0.4 },
        ease: 'power2.out',
        directional: true,
      },
      onUpdate: (self) => {
        tl.progress(self.progress)
        const activeIdx = Math.round(self.progress * (n - 1))
        setSlideIdx(prev => prev !== activeIdx ? activeIdx : prev)
        if (progressRef.current) {
          gsap.set(progressRef.current, {
            scaleX: self.progress, transformOrigin: 'left center', overwrite: true,
          })
        }
        if (counterRef.current) counterRef.current.textContent = `0${activeIdx + 1}`
      },
      invalidateOnRefresh: true,
    })

    return () => {
      st.kill()
      tl.kill()
    }
  }, [])

  return (
    <section ref={sectionRef} className="work-section" id="work">
      {/* Top bar */}
      <div className="work-topBar">
        <h2 className="work-sectionLabel">
          MY <span className="do-h2">WORK</span>
        </h2>
        <div className="work-counter">
          <span ref={counterRef} className="work-cCur">01</span>
          <span className="work-cSep"> / </span>
          <span className="work-cTot">0{PROJECTS.length}</span>
        </div>
      </div>

      {/* Horizontal track */}
      <div
        ref={trackRef}
        className="work-track"
        style={{ width: `${PROJECTS.length * 100}vw` }}
      >
        {PROJECTS.map((proj, i) => (
          <div key={proj.id} className="work-slide">
            <div
              ref={el => { bgRefs.current[i] = el }}
              className="work-slideBg"
            >
              <img
                src={proj.image}
                alt={proj.title}
                className="work-slideImg"
              />
              <div className="work-slideOverlayLeft"   aria-hidden />
              <div className="work-slideOverlayBottom" aria-hidden />
              <div className="work-slideVignette"      aria-hidden />
            </div>

            <span className="work-slideNum" aria-hidden>0{i + 1}</span>

            <div
              ref={el => { contentRefs.current[i] = el }}
              className="work-slideContent"
            >
              <div className="work-slideLeft">
                <div className="work-meta">
                  <span className="work-typeTag">{proj.type}</span>
                </div>
                <h2 className="work-title">{proj.title}</h2>
                <p  className="work-subtitle">{proj.subtitle}</p>

                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="work-liveBtn"
                >
                  <span>Live Demo</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>

              <div className="work-slideRight">
                <p className="work-desc">{proj.desc}</p>
                <div className="work-stack">
                  {proj.tech.map(t => (
                    <span key={t} className="work-tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="work-bottomUI">
        <div className="work-progressTrack">
          <div ref={progressRef} className="work-progressBar" />
        </div>
      </div>
    </section>
  )
}
