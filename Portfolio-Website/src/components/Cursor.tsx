import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let hover = false;
    const heartbeatAudio = new Audio("/sounds/heartbeat.mp3");
    heartbeatAudio.loop = true;
    heartbeatAudio.volume = 0;
    
    let fadeTween: gsap.core.Tween | null = null;

    const playHeartbeat = () => {
      if (window.innerWidth <= 768) return; // Disable on mobile
      if (heartbeatAudio.paused) {
        heartbeatAudio.play().catch(() => {});
      }
      if (fadeTween) fadeTween.kill();
      fadeTween = gsap.to(heartbeatAudio, { volume: 1, duration: 0.5 });
    };

    const pauseHeartbeat = () => {
      if (fadeTween) fadeTween.kill();
      fadeTween = gsap.to(heartbeatAudio, { 
        volume: 0, 
        duration: 0.5, 
        onComplete: () => {
          heartbeatAudio.pause();
        } 
      });
    };

    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    document.addEventListener("mousemove", (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    });
    requestAnimationFrame(function loop() {
      if (!hover) {
        const delay = 6;
        cursorPos.x += (mousePos.x - cursorPos.x) / delay;
        cursorPos.y += (mousePos.y - cursorPos.y) / delay;
        gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });
      }
      requestAnimationFrame(loop);
    });
    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;
      element.addEventListener("mouseenter", (e: MouseEvent) => {
        if (window.innerWidth <= 768) return; // Disable hover effects on mobile
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");

          gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.4, ease: "power2.out" });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          cursor.style.setProperty("--cursorW", `${rect.width}px`);
          hover = true;
          playHeartbeat();
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      });
      element.addEventListener("mouseleave", () => {
        if (window.innerWidth <= 768) return;
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
        pauseHeartbeat();
      });
    });
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
