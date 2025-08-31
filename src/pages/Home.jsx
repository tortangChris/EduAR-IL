import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const Home = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const containerRef = useRef();
  const [inAR, setInAR] = useState(false);
  const [placed, setPlaced] = useState(false);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full h-screen" ref={containerRef}>
      <CanvasWrapper
        containerRef={containerRef}
        positions={positions}
        data={data}
        setInAR={setInAR}
        placed={placed}
        setPlaced={setPlaced}
      />
    </div>
  );
};

const CanvasWrapper = ({
  containerRef,
  positions,
  data,
  setInAR,
  placed,
  setPlaced,
}) => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 4, 12], fov: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x000000), 0);
        gl.shadowMap.enabled = true;
        gl.xr.enabled = true;
      }}
    >
      <ARSetup containerRef={containerRef} setInAR={setInAR} />
      <Reticle placed={placed} setPlaced={setPlaced}>
        {data.map((value, i) => (
          <Box key={i} index={i} value={value} position={positions[i]} />
        ))}
      </Reticle>
    </Canvas>
  );
};

function ARSetup({ containerRef, setInAR }) {
  const { gl } = useThree();
  const arButtonRef = useRef();

  useEffect(() => {
    if (!gl || !containerRef.current) return;

    try {
      const button = ARButton.createButton(gl, {
        requiredFeatures: ["hit-test"],
      });

      button.style.position = "absolute";
      button.style.bottom = "12px";
      button.style.left = "12px";
      button.style.padding = "8px 12px";
      button.style.borderRadius = "8px";
      button.style.fontSize = "14px";
      button.style.zIndex = "999";

      containerRef.current.appendChild(button);
      arButtonRef.current = button;

      function onSessionStart() {
        setInAR(true);
        gl.setClearColor(new THREE.Color(0x000000), 0);
      }

      function onSessionEnd() {
        setInAR(false);
      }

      if (gl.xr && gl.xr.addEventListener) {
        gl.xr.addEventListener("sessionstart", onSessionStart);
        gl.xr.addEventListener("sessionend", onSessionEnd);
      }

      return () => {
        if (containerRef.current?.contains(button)) {
          containerRef.current.removeChild(button);
        }
        if (gl.xr && gl.xr.removeEventListener) {
          gl.xr.removeEventListener("sessionstart", onSessionStart);
          gl.xr.removeEventListener("sessionend", onSessionEnd);
        }
      };
    } catch (err) {}
  }, [gl, containerRef, setInAR]);

  return null;
}

function Reticle({ children, placed, setPlaced }) {
  const { gl } = useThree();
  const reticleRef = useRef();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [hitTestSourceRequested, setHitTestSourceRequested] = useState(false);

  useFrame(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    const frame = gl.xr.getFrame();
    if (!frame) return;

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => {
            setHitTestSource(source);
          });
      });
      setHitTestSourceRequested(true);
    }

    if (hitTestSource && !placed) {
      const referenceSpace = gl.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        // Place the objects at first detected hit
        reticleRef.current.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
        reticleRef.current.updateMatrixWorld(true);

        // ✅ Immediately place the objects and lock them
        setPlaced(true);
      }
    }
  });

  return (
    <group>
      {/* Reticle (only used for initial detection) */}
      <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="lime" />
      </mesh>

      {/* Once placed, show the objects */}
      {placed && (
        <group position={reticleRef.current?.position}>{children}</group>
      )}
    </group>
  );
}

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

export default Home;
