import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { setCharTimeline, setAllTimeline } from "../../../utils/GsapScroll";


const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>((resolve, reject) => {
      try {
        let character: THREE.Object3D;
        loader.load(
          "/models/character_webp.glb",
          async (gltf) => {
            if (renderer.getContext().isContextLost()) {
              dracoLoader.dispose();
              resolve(null);
              return;
            }
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: THREE.Object3D) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // Sanitize NaN values in geometry before computing bounding sphere
                if (mesh.geometry) {
                  const posAttr = mesh.geometry.getAttribute('position');
                  if (posAttr) {
                    const arr = posAttr.array;
                    let hasNaN = false;
                    for (let i = 0; i < arr.length; i++) {
                      if (isNaN(arr[i] as number)) {
                        (arr as Float32Array)[i] = 0;
                        hasNaN = true;
                      }
                    }
                    if (hasNaN) {
                      posAttr.needsUpdate = true;
                    }
                  }
                  mesh.geometry.computeBoundingSphere();
                  mesh.geometry.computeBoundingBox();
                }
                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });
            
            // Use a fixed scale for Mixamo characters instead of fragile Box3 which can fail
            character.scale.setScalar(6.5); 
            character.position.y = 3.36; 

            
            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            const footR = character!.getObjectByName("footR");
            if (footR) footR.position.y = 3.36;
            const footL = character!.getObjectByName("footL");
            if (footL) footL.position.y = 3.36;
            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
