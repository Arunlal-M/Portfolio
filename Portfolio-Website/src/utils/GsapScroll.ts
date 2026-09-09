import * as THREE from "three";
import gsap from "gsap";

export function setCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  let intensity: number = 0;
  setInterval(() => {
    intensity = Math.random();
  }, 200);
  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: ".landing-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const tl3 = gsap.timeline({
    scrollTrigger: {
      trigger: ".whatIDO",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  let screenLight: THREE.Mesh | undefined, monitor: THREE.Mesh | undefined;
  character?.children.forEach((object: THREE.Object3D) => {
    if (object.name === "Plane004") {
      object.children.forEach((child: THREE.Object3D) => {
        const childMesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
        if (childMesh.material) {
          childMesh.material.transparent = true;
          childMesh.material.opacity = 0;
          if (childMesh.material.name === "Material.027") {
            monitor = childMesh;
            childMesh.material.color.set("#FFFFFF");
          }
        }
      });
    }
    const objectMesh = object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    if (object.name === "screenlight" && objectMesh.material) {
      objectMesh.material.transparent = true;
      objectMesh.material.opacity = 0;
      objectMesh.material.emissive.set("#C8BFFF");
      gsap.timeline({ repeat: -1, repeatRefresh: true }).to(objectMesh.material, {
        emissiveIntensity: () => intensity * 8,
        duration: () => Math.random() * 0.6,
        delay: () => Math.random() * 0.1,
      });
      screenLight = objectMesh;
    }
  });
  const neckBone = character?.getObjectByName("mixamorigNeck")
              || character?.getObjectByName("mixamorig:Neck")
              || character?.getObjectByName("Neck")
              || character?.getObjectByName("neck")
              || character?.getObjectByName("spine005");
  if (window.innerWidth > 1024) {
    if (character) {
      tl1
        .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 1 }, 0)
        .to(camera.position, { z: 22 }, 0)
        .fromTo(".character-model", { x: 0 }, { x: "-25%", duration: 1 }, 0)
        .to(".landing-container", { opacity: 0, duration: 0.4 }, 0)
        .to(".landing-container", { y: "40%", duration: 0.8 }, 0)
        .fromTo(".about-me", { y: "-50%" }, { y: "0%" }, 0);

      tl2
        .to(
          camera.position,
          { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" },
          0
        )
        .to(".about-section", { y: "30%", duration: 5, delay: 1.5 }, 0)
        .to(".about-section", { opacity: 0, delay: 4.5, duration: 2 }, 0)
        .fromTo(
          ".character-model",
          { pointerEvents: "inherit" },
          { pointerEvents: "none", x: "-12%", delay: 2, duration: 5 },
          0
        )
        .fromTo(character.rotation, { y: 0.7, x: 0 }, { y: 1.0, x: 0.12, delay: 2, duration: 2, immediateRender: false }, 0);
        
      if (neckBone) {
        const baseNeckX = neckBone.rotation.x;
        // Butter smooth transitions using easing, perfectly matched to the 6-second section scroll:
        // 1. Smoothly look up as the section moves upwards across the screen (0s to 4.5s)
        tl2.fromTo(neckBone.rotation, { x: baseNeckX }, { x: baseNeckX - 0.45, duration: 4.5, ease: "power1.inOut" }, 0)
        // 2. Smoothly return to normal resting pose as the section fades away (4.5s to 6.0s)
           .to(neckBone.rotation, { x: baseNeckX, duration: 1.5, delay: 4.5, ease: "power1.inOut" }, 0);
      }
      if (monitor) tl2.to(monitor.material, { opacity: 1, duration: 0.8, delay: 3.2 }, 0);
      if (screenLight) tl2.to(screenLight.material, { opacity: 1, duration: 0.8, delay: 4.5 }, 0);

      tl2
        .fromTo(
          ".what-box-in",
          { display: "none" },
          { display: "flex", duration: 0.1, delay: 6 },
          0
        );

      if (monitor) {
        tl2.fromTo(
          monitor.position,
          { y: -10, z: 2 },
          { y: 0, z: 0, delay: 1.5, duration: 3 },
          0
        );
      }
      
      tl2
        .fromTo(
          ".character-rim",
          { opacity: 1, scaleX: 1.4 },
          { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 },
          0.3
        );

      tl3
        .fromTo(
          ".character-model",
          { y: "0%" },
          { y: "-100%", duration: 4, ease: "none", delay: 1 },
          0
        )
        .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2 }, 0)
        .to(character.rotation, { x: -0.04, duration: 2, delay: 1 }, 0);
    }
  } else {
    if (character) {
      const tM2 = gsap.timeline({
        scrollTrigger: {
          trigger: ".what-box-in",
          start: "top 70%",
          end: "bottom top",
        },
      });
      tM2.to(".what-box-in", { display: "flex", duration: 0.1, delay: 0 }, 0);
    }
  }
}

export function setAllTimeline() {
  // Obsolete animation for the old Career section
  // The new Career component handles its own GSAP timeline.
}
