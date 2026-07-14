import * as THREE from "three";

export const handleMouseMove = (
  event: MouseEvent,
  setMousePosition: (x: number, y: number) => void
) => {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  setMousePosition(mouseX, mouseY);
};

export const handleTouchMove = (
  event: TouchEvent,
  setMousePosition: (x: number, y: number) => void
) => {
  const mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
  setMousePosition(mouseX, mouseY);
};

export const handleTouchEnd = (
  setMousePosition: (
    x: number,
    y: number,
    interpolationX: number,
    interpolationY: number
  ) => void
) => {
  setTimeout(() => {
    setMousePosition(0, 0, 0.03, 0.03);
    setTimeout(() => {
      setMousePosition(0, 0, 0.1, 0.2);
    }, 1000);
  }, 2000);
};

export const handleHeadRotation = (
  headBone: THREE.Object3D,
  mouseX: number,
  mouseY: number,
  interpolationX: number,
  interpolationY: number,
  lerp: (x: number, y: number, t: number) => number
) => {
  if (!headBone) return;

  // Initialize smoothed values and cache the base resting rotation
  if (headBone.userData.smoothedX === undefined) {
    headBone.userData.smoothedX = 0;
    headBone.userData.smoothedY = 0;
    // Cache the base quaternion to prevent endless accumulation and preserve the exact rest pose
    headBone.userData.baseQuaternion = headBone.quaternion.clone();
  }

  if (window.scrollY < 200) {
    // Max rotation limits for head tracking
    const maxRotY = Math.PI / 4; 
    const maxRotX = Math.PI / 6;

    // Smoothly transition the offsets towards the mouse position
    headBone.userData.smoothedY = lerp(
      headBone.userData.smoothedY,
      mouseX * maxRotY,
      interpolationY
    );
    
    headBone.userData.smoothedX = lerp(
      headBone.userData.smoothedX,
      -mouseY * maxRotX, // Negative because typical screen Y is inverted relative to 3D pitch
      interpolationX
    );
  } else {
    // Smoothly return to center when scrolled away
    if (window.innerWidth > 1024) {
      headBone.userData.smoothedX = lerp(headBone.userData.smoothedX, 0, 0.2);
      headBone.userData.smoothedY = lerp(headBone.userData.smoothedY, 0, 0.2);
    }
  }

  // Create an offset quaternion using YXZ order. 
  // YXZ applies Yaw (turning) before Pitch (looking down), which prevents the chin from popping out!
  const eulerOffset = new THREE.Euler(
    headBone.userData.smoothedX,
    headBone.userData.smoothedY,
    0,
    "YXZ"
  );
  const quatOffset = new THREE.Quaternion().setFromEuler(eulerOffset);
  
  // Apply the offset in the PARENT space of the base resting pose.
  // By multiplying quatOffset * baseQuaternion, we ensure the left/right turns 
  // happen on a perfectly flat plane, completely ignoring any diagonal tilts in the bone's local axes!
  headBone.quaternion.copy(quatOffset).multiply(headBone.userData.baseQuaternion);
};
