import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

// -------------------------
// ARControls: enables WebXR AR and adds ARButton
// When an AR session starts we position the group "sceneRoot"
// a short distance in front of the camera so the existing visuals
// appear in the AR world. This is a simple, robust approach that
// doesn't require hit-test support (so it works on more devices).
// You can later extend this to use hit-test for surface placement.
// -------------------------
function ARControls({ sceneRootRef, distance = 1.5 }) {
  const { gl, camera, scene } = useThree();
  const arButtonRef = useRef();

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    // enable XR on renderer
    gl.xr.enabled = true;

    // Create the ARButton and add to the page
    const btn = ARButton.createButton(gl, {
      // If you want hit-test later, add requiredFeatures: ['hit-test']
      requiredFeatures: [],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    });

    btn.style.position = "absolute";
    btn.style.bottom = "20px";
    btn.style.left = "20px";
    btn.style.zIndex = "9999";

    document.body.appendChild(btn);
    arButtonRef.current = btn;

    function onSessionStart() {
      // When AR session starts, position sceneRoot a fixed distance in front
      // of the camera's current world transform. This gives a predictable
      // placement of your objects in AR without hit-test.
      const root = sceneRootRef.current;
      const cam = camera;
      if (root && cam) {
        // compute point in front of camera
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);

        const targetPos = camPos.clone().add(dir.multiplyScalar(distance));

        // set world position/rotation of root
        root.position.copy(targetPos);

        // make root face the camera (optional)
        const lookAt = camPos.clone();
        root.lookAt(lookAt);

        // ensure transforms apply in world-space
        root.updateMatrixWorld();
      }
    }

    function onSessionEnd() {
      // optional cleanup
    }

    // Listen for sessionstart on the renderer's xr manager
    const xr = gl.xr;
    const session = xr.getSession && xr.getSession();
    // three's XR manager dispatches "sessionstart"/"sessionend" events on the renderer.xr
    // but some builds require listening on the button or session itself. We'll attach both.

    xr.addEventListener("sessionstart", onSessionStart);
    xr.addEventListener("sessionend", onSessionEnd);

    // Also guard in case ARButton returns a session directly later
    // Cleanup when unmounting
    return () => {
      xr.removeEventListener("sessionstart", onSessionStart);
      xr.removeEventListener("sessionend", onSessionEnd);
      if (arButtonRef.current && arButtonRef.current.parentNode) {
        arButtonRef.current.parentNode.removeChild(arButtonRef.current);
      }
    };
  }, [gl, camera, sceneRootRef, distance]);

  return null;
}

// -------------------------
// Box component (mostly unchanged from your original)
// -------------------------
const Box = ({ index, value, position = [0, 0, 0] }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

// -------------------------
// Main component
// -------------------------
export default function Home({ data = [10, 20, 30, 40], spacing = 2.0 }) {
  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // a root group that we'll move into AR world when session starts
  const sceneRootRef = useRef();

  return (
    <div className="w-full h-screen bg-gray-50 relative">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        shadows
        onCreated={({ gl }) => {
          // Ensure we enable XR capability on three renderer (for non-AR usage the button won't show)
          gl.xr.enabled = true;
        }}
      >
        {/* Make sure there's a small amount of ambient light so materials are visible in AR */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Root group; position will be adjusted when AR starts */}
        <group ref={sceneRootRef}>
          {/* Row of boxes */}
          {data.map((value, i) => (
            <Box key={i} index={i} value={value} position={positions[i]} />
          ))}
        </group>

        {/* OrbitControls still present for non-AR preview in browser */}
        <OrbitControls makeDefault />

        {/* ARControls attaches ARButton and positions the group when AR session starts */}
        <ARControls sceneRootRef={sceneRootRef} distance={1.5} />
      </Canvas>
    </div>
  );
}
