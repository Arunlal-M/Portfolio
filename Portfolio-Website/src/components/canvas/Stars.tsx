import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";
// @ts-expect-error - maath has no bundled type declarations
import * as random from "maath/random/dist/maath-random.esm";
import type { ComponentProps, ElementRef } from "react";

const Stars = (props: Omit<ComponentProps<typeof Points>, "ref">) => {
  const ref = useRef<ElementRef<typeof Points>>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(999), { radius: 1.2 }) as Float32Array);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color='#39FF14'
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <Stars />
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default StarsCanvas;
