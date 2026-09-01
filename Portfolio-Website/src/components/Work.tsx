import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { smoother } from './Navbar'
import { PROJECTS } from '../data/projects'
import './styles/Work.css'

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin)

export default function Work() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])
  const bgRefs      = useRef<(HTMLDivElement | null)[]>([])
  const counterRef  = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

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

    // Add empty pause at start: 1 full duration
    tl.to({}, { duration: 1 })

    // Horizontal slide - xPercent is viewport-independent
    tl.to(track, {
      xPercent: -((n - 1) / n * 100),
      ease: 'none',
      duration: n - 1,
    }, 1)

    for (let i = 0; i < n - 1; i++) {
      const curr   = contentRefs.current[i]
      const next   = contentRefs.current[i + 1]
      const nextBg = bgRefs.current[i + 1]
      
      const st_time = i + 1

      if (curr) {
        tl.to(curr, {
          opacity: 0, y: -40, filter: 'blur(6px)',
          duration: 0.2, ease: 'power2.in',
        }, st_time + 0.30)
      }

      if (nextBg) {
        tl.fromTo(nextBg,
          { scale: 1.04 },
          { scale: 1.0, duration: 1.0, ease: 'power2.out' },
          st_time
        )
      }

      if (next) {
        tl.to(next, { opacity: 1, y: 0, duration: 0.2 }, st_time + 0.44)
        const meta  = next.querySelector(`.work-meta`)
        const title = next.querySelector(`.work-title`)
        const sub   = next.querySelector(`.work-subtitle`)
        const desc  = next.querySelector(`.work-desc`)
        const tags  = next.querySelectorAll(`.work-tag`)
        const btn   = next.querySelector(`.work-liveBtn`)

        if (meta)  tl.fromTo(meta,  { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, st_time + 0.45)
        if (title) tl.fromTo(title, { opacity: 0, y: 20 },  { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out'   }, st_time + 0.48)
        if (sub)   tl.fromTo(sub,   { y: 12, opacity: 0 },  { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out' }, st_time + 0.54)
        if (desc)  tl.fromTo(desc,  { y: 10, opacity: 0 },  { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, st_time + 0.58)
        if (tags.length) {
          tl.fromTo(tags,  { y: 6, opacity: 0 },  { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out', stagger: 0.03 }, st_time + 0.65)
        }
        if (btn)   tl.fromTo(btn,   { y: 8, opacity: 0 },  { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out' }, st_time + 0.72)
      }
    }

    // Add empty pause at end: 1 full duration
    // Position it explicitly at 'n' so the timeline total duration is exactly n + 1.
    tl.to({}, { duration: 1 }, n)

    const snapPoints = [0];
    for (let i = 1; i < n - 1; i++) snapPoints.push((i + 1) / (n + 1));
    snapPoints.push(1);

    let timer: gsap.core.Tween | null = null;

    const startTimer = (currentIdx: number) => {
      if (timer) timer.kill();
      if (currentIdx >= n - 1) return; // stops on last project
      
      timer = gsap.delayedCall(3, () => {
        const trigger = ScrollTrigger.getById('work-st');
        if (!trigger) return;
        
        // Ensure we only auto-slide if the user is still within this section
        const scrollY = smoother ? smoother.scrollTop() : window.scrollY;
        if (scrollY < trigger.start - 10 || scrollY > trigger.end + 10) return;
        
        const targetProgress = snapPoints[currentIdx + 1];
        const targetY = trigger.start + targetProgress * (trigger.end - trigger.start);
        
        if (smoother) {
          gsap.to(smoother, {
            scrollTop: targetY,
            duration: 1,
            ease: 'power2.inOut'
          });
        } else {
          gsap.to(window, {
            scrollTo: targetY,
            duration: 1,
            ease: 'power2.inOut'
          });
        }
      });
    };

    const st = ScrollTrigger.create({
      id:       'work-st',
      trigger:  section,
      start:    'top top',
      end:      () => `+=${(n + 1) * window.innerHeight}`,
      pin:      true,
      snap: {
        snapTo: snapPoints,
        delay: 0,
        duration: { min: 0.2, max: 0.4 },
        ease: 'power2.out',
        directional: true,
      },
      onUpdate: (self) => {
        tl.progress(self.progress)
        
        const time = self.progress * (n + 1);
        let activeIdx = Math.floor(time - 0.5);
        if (activeIdx < 0) activeIdx = 0;
        if (activeIdx > n - 1) activeIdx = n - 1;

        startTimer(activeIdx);

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
              <img src={proj.image} alt={proj.title} className="work-slideImg" width="1200" height="675" loading="lazy" />
              <div className="work-slideOverlayLeft"   aria-hidden="true" />
              <div className="work-slideOverlayBottom" aria-hidden="true" />
              <div className="work-slideVignette"      aria-hidden="true" />
            </div>

            <span className="work-slideNum" aria-hidden="true">0{i + 1}</span>

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

                {proj.link && proj.link !== "#" && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="work-liveBtn"
                  >
                    <span>Live Demo</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
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
