import React, { useRef, useState } from "react";
import { ARCanvas, useHitTest } from "@react-three/xr";
import { Text } from "@react-three/drei";
import { Vector3, Quaternion } from "three";

const CubeWithLabel = () => {
  const hitPosition = useRef(new Vector3());
  const [placed, setPlaced] = useState(false);

  // useHitTest updates position if AR surface is detected
  useHitTest((hitMatrix) => {
    if (!placed) {
      hitMatrix.decompose(hitPosition.current, new Quaternion(), new Vector3());
    }
  });

  // Tap handler to place cube
  const handleTap = () => {
    setPlaced(true);
  };

  // Hide cube until it’s placed
  if (!placed) return null;

  return (
    <group position={hitPosition.current} onClick={handleTap}>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        Array Data Structure
      </Text>
    </group>
  );
};

const Home = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ARCanvas
        sessionInit={{
          requiredFeatures: ["hit-test", "dom-overlay"],
          domOverlay: { root: document.body },
        }}
        camera={{ position: [0, 0, 0] }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.5, 1, 0.5]} intensity={1} />
        <CubeWithLabel />
      </ARCanvas>
    </div>
  );
};

export default Home;
