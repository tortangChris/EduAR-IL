// HomeAR.jsx
import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const HomeAR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const [placed, setPlaced] = useState(false);

  return (
    <div className="w-full h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          const arButton = ARButton.createButton(gl, {
            requiredFeatures: ["hit-test"],
          });
          document.body.appendChild(arButton);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Reticle placed={placed} setPlaced={setPlaced}>
          <group>
            {data.map((value, i) => (
              <Box key={i} index={i} value={value} position={positions[i]} />
            ))}
            {/* ✅ Shadow receiver plane */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              position={[0, 0, 0]}
            >
              <planeGeometry args={[20, 20]} />
              <shadowMaterial opacity={0.4} />
            </mesh>
          </group>
        </Reticle>
      </Canvas>
    </div>
  );
};

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

    if (hitTestSource) {
      const referenceSpace = gl.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        // Move reticle to detected plane
        reticleRef.current.visible = true;
        reticleRef.current.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
        reticleRef.current.updateMatrixWorld(true);

        // ✅ If not locked, children always follow reticle
        if (!placed) {
          reticleRef.current.add(children);
        }
      }
    }
  });

  return (
    <group>
      {/* Reticle marker */}
      <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={true}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="lime" />
      </mesh>
    </group>
  );
}

const Box = ({ index, value, position = [0, 0, 0] }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      {/* Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      {/* Value */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
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

export default HomeAR;
