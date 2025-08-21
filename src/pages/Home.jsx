import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { XR, Hands, Controllers, useXR } from "@react-three/xr";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

function DraggableBox({ position, color }) {
  const mesh = useRef();
  const { controllers } = useXR();
  const [grabbedBy, setGrabbedBy] = useState(null);
  const grabOffset = useRef([0, 0, 0]);

  useFrame(() => {
    if (!grabbedBy || !mesh.current) return;
    const controller = controllers.find(
      (c) => c.inputSource.handedness === grabbedBy
    );
    if (!controller) return;

    const cpos = new THREE.Vector3();
    controller.controller.getWorldPosition(cpos);
    const [ox, oy, oz] = grabOffset.current;
    mesh.current.position.set(cpos.x + ox, cpos.y + oy, cpos.z + oz);
  });

  const tryGrab = (handedness) => {
    if (!mesh.current) return;
    const controller = controllers.find(
      (c) => c.inputSource.handedness === handedness
    );
    if (!controller) return;

    const controllerPos = new THREE.Vector3();
    controller.controller.getWorldPosition(controllerPos);
    const meshPos = new THREE.Vector3();
    mesh.current.getWorldPosition(meshPos);

    if (controllerPos.distanceTo(meshPos) < 0.25) {
      setGrabbedBy(handedness);
      grabOffset.current = [
        meshPos.x - controllerPos.x,
        meshPos.y - controllerPos.y,
        meshPos.z - controllerPos.z,
      ];
    }
  };

  const release = (handedness) => {
    if (grabbedBy === handedness) setGrabbedBy(null);
  };

  return (
    <mesh
      ref={mesh}
      position={position}
      onClick={() => tryGrab("right")}
      onPointerUp={() => release("right")}
    >
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

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
          <>
            <div style={{ fontWeight: 700 }}>AR Mode</div>
            <div>Tap near a box to grab and move it.</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>Preview Mode</div>
            <div>Use mouse to orbit/zoom. Press Start AR to enter AR.</div>
          </>
        )}
      </div>
    </Html>
  );
}

function Scene({ inAR }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[0.5, 1, 0.5]} intensity={0.6} />

      <DraggableBox position={[0, 0, -0.5]} color="#ff6666" />
      <DraggableBox position={[0.2, 0, -0.5]} color="#66ff66" />
      <DraggableBox position={[-0.2, 0, -0.5]} color="#6666ff" />

      {!inAR && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial opacity={0.3} transparent />
        </mesh>
      )}

      <Instructions inAR={inAR} />
    </>
  );
}

export default function Home() {
  const [inAR, setInAR] = useState(false);

  const startAR = async () => {
    if (navigator.xr) {
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test", "local-floor"],
      });
      const gl = document.querySelector("canvas").getContext("webgl");
      gl.xr.setSession(session);
      setInAR(true);
      session.addEventListener("end", () => setInAR(false));
    } else {
      alert("WebXR not supported on this device/browser");
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <button
        style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}
        onClick={startAR}
      >
        Start AR
      </button>

      <Canvas camera={{ position: [0, 1.6, 1], fov: 60 }}>
        <Suspense fallback={null}>
          <XR>
            <Controllers />
            <Hands />
            <Scene inAR={inAR} />
          </XR>
          {!inAR && <OrbitControls />}
        </Suspense>
      </Canvas>
    </div>
  );
}
