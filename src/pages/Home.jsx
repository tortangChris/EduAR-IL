import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ARButton, XR, Hands, useXR, Controllers } from "@react-three/xr";
import { Html, OrbitControls } from "@react-three/drei";

// DraggableBox: a box that can be grabbed (selectstart) from an XR controller and moved around.
function DraggableBox({ position, color = "orange", name }) {
  const mesh = useRef();
  const { controllers } = useXR();
  const [grabbedBy, setGrabbedBy] = useState(null); // controller id
  const grabOffset = useRef([0, 0, 0]);

  // When a controller 'selectstart' hits this mesh, set it as grabbed.
  useEffect(() => {
    if (!controllers) return;

    const onSelectStart = (ev) => {
      // ev.target is the controller object in three
      const controller = ev.target;
      // raycast from controller to detect intersection with this mesh
      const tempRay = controller.getObjectByProperty ? controller : controller; // fallback

      // simple distance check instead (works fairly well for AR hand-held dragging)
      if (!mesh.current) return;
      const controllerPos = new THREE.Vector3();
      controller.getWorldPosition(controllerPos);
      const meshPos = new THREE.Vector3();
      mesh.current.getWorldPosition(meshPos);
      const dist = controllerPos.distanceTo(meshPos);

      // if controller is near enough, grab
      if (dist < 0.25) {
        setGrabbedBy(controller.uuid);
        // compute offset controller -> mesh
        grabOffset.current = [
          meshPos.x - controllerPos.x,
          meshPos.y - controllerPos.y,
          meshPos.z - controllerPos.z,
        ];
      }
    };

    const onSelectEnd = (ev) => {
      const controller = ev.target;
      if (grabbedBy === controller.uuid) setGrabbedBy(null);
    };

    // attach listeners
    controllers.forEach((c) => {
      c.addEventListener && c.addEventListener("selectstart", onSelectStart);
      c.addEventListener && c.addEventListener("selectend", onSelectEnd);
    });

    return () => {
      controllers.forEach((c) => {
        c.removeEventListener &&
          c.removeEventListener("selectstart", onSelectStart);
        c.removeEventListener &&
          c.removeEventListener("selectend", onSelectEnd);
      });
    };
  }, [controllers, grabbedBy]);

  // update box position each frame if grabbed
  useFrame(() => {
    if (!grabbedBy || !mesh.current || !controllers) return;
    const controller = controllers.find((c) => c.uuid === grabbedBy);
    if (!controller) return;

    const cpos = new THREE.Vector3();
    controller.getWorldPosition(cpos);
    const [ox, oy, oz] = grabOffset.current;
    mesh.current.position.set(cpos.x + ox, cpos.y + oy, cpos.z + oz);
  });

  return (
    <mesh ref={mesh} position={position} castShadow receiveShadow name={name}>
      <boxBufferGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Helper: small instructions shown in AR and non-AR
function Instructions({ inAR }) {
  return (
    <Html center>
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: 8,
          borderRadius: 8,
        }}
      >
        {inAR ? (
          <div>
            <div style={{ fontWeight: 700 }}>AR mode</div>
            <div>
              Point camera to flat surface, then tap "ENTER AR" if prompted.
            </div>
            <div>
              To move a box: bring controller / finger near a box and tap to
              grab, move, then release.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700 }}>Non-AR preview</div>
            <div>Use mouse to orbit/zoom and click the boxes to see them.</div>
          </div>
        )}
      </div>
    </Html>
  );
}

// Main scene with three boxes and basic lighting
function Scene({ inAR }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[0.5, 1, 0.5]} intensity={0.6} castShadow />

      {/* three boxes placed near each other */}
      <DraggableBox position={[0, 0, -0.5]} color={"#ff6666"} name={"box1"} />
      <DraggableBox position={[0.2, 0, -0.5]} color={"#66ff66"} name={"box2"} />
      <DraggableBox
        position={[-0.2, 0, -0.5]}
        color={"#6666ff"}
        name={"box3"}
      />

      {/* simple ground indicator (only visible in non-AR preview) */}
      {!inAR && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.06, 0]}
          receiveShadow
        >
          <planeBufferGeometry args={[5, 5]} />
          <meshStandardMaterial opacity={0.3} transparent />
        </mesh>
      )}

      <Instructions inAR={inAR} />
    </>
  );
}

export default function Home() {
  const [inAR, setInAR] = useState(false);

  // This component shows the Canvas and XR button. When AR enters/exits we toggle state so instructions update.
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* AR Button is provided by @react-three/xr. It automatically requests session when available. */}
      <ARButton
        style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}
        sessionInit={{
          optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
        }}
        onSessionStart={() => setInAR(true)}
        onSessionEnd={() => setInAR(false)}
      />

      <Canvas camera={{ position: [0, 1.6, 1], fov: 60 }} shadows>
        <Suspense fallback={null}>
          <XR
            onSessionStart={() => setInAR(true)}
            onSessionEnd={() => setInAR(false)}
          >
            <Controllers />
            <Hands />
            <Scene inAR={inAR} />
          </XR>
          {/* OrbitControls only for non-AR preview so you can test in browser */}
          {!inAR && <OrbitControls />}
        </Suspense>
      </Canvas>
    </div>
  );
}

// NOTE: This file relies on THREE being available globally for helper Vector3.
// If you prefer local import, add: import * as THREE from 'three';
