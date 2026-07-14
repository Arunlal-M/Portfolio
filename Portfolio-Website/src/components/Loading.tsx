import React,{ useEffect, useState, useRef } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
// import Marquee from "react-fast-marquee";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const LoadingCharacterModel = React.memo(({ loaded }: { loaded: boolean }) => {
  const { scene, animations } = useGLTF("/models/Character_RunFast.glb");
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const [spinBack, setSpinBack] = useState(false);

  useEffect(() => {
    // Wait 1000ms after loaded becomes true (giving the Welcome note time to fade in)
    if (loaded) {
      const timer = setTimeout(() => setSpinBack(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  useEffect(() => {
    // Automatically play the first animation (which should be the RunFast animation)
    const actionName = Object.keys(actions)[0];
    if (actionName && actions[actionName]) {
      // Explicitly set to loop infinitely so it never stops even if loading pauses
      actions[actionName].setLoop(THREE.LoopRepeat, Infinity);
      actions[actionName].play();
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Target scale: 3 if spinBack is true, 0.9 if not
    const targetScale = spinBack ? 3 : 0.9;
    // Target rotation: 0 (straight) if spinBack, Math.PI / 2 (right side) if not
    const targetRotY = spinBack ? 0 : Math.PI / 2;
    // Target Y position: -2.5 (centered for large) if spinBack, 0.5 (above loader for small) if not
    const targetY = spinBack ? -2.5 : 0.5;

    // Smoothly interpolate the scale
    groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 3);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale, delta * 3);
    groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale, delta * 3);
    
    // Smoothly interpolate the rotation and position
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 3);
  });

  // Start with the initial restricted scale and rotation so it doesn't snap on load
  // Position moved higher up (Y = 0.5) so it runs directly above the loading text box
  return (
    <group ref={groupRef} position={[0, 0.5, 0]} scale={0.9} rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scene} />
    </group>
  );
});

// Preload the model so it's ready as fast as possible
useGLTF.preload("/models/Character_RunFast.glb");

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  if (percent >= 100) {
    setTimeout(() => {
      setLoaded(true);
      setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
    }, 600);
  }

  useEffect(() => {
    import("./utils/initialFX").then((module) => {
      if (isLoaded) {
        setClicked(true);
        setTimeout(() => {
          if (module.initialFX) {
            module.initialFX();
          }
          setIsLoading(false);
        }, 900);
      }
    });
  }, [isLoaded]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      {/* <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          Logo
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div> */}
      <div className="loading-screen">
        {/* 3D Character Canvas */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
          <Canvas camera={{ position: [0, 1, 6], fov: 50 }}>
            <ambientLight intensity={2} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <LoadingCharacterModel loaded={loaded} />
          </Canvas>
        </div>
        {/* <div className="loading-marquee">
          <Marquee>
            <span> A Creative Developer</span> <span>A Cloud DevOps</span>
            <span> A Creative Developer</span> <span>A Cloud DevOps</span>
          </Marquee>
        </div> */}
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;

  let interval = setInterval(() => {
    if (percent <= 50) {
      let rand = Math.round(Math.random() * 5);
      percent = percent + rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        percent = percent + Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 2);
    });
  }
  return { loaded, percent, clear };
};
