import React, { useRef, useState } from "react";
import { ARCanvas, useHitTest } from "@react-three/xr";
import { Text } from "@react-three/drei";
import { Vector3, Quaternion } from "three";

const CubeWithLabel = () => {
  const hitPosition = useRef(new Vector3());
  const [visible, setVisible] = useState(false);

  useHitTest((hitMatrix) => {
    hitMatrix.decompose(hitPosition.current, new Quaternion(), new Vector3());
    setVisible(true); // show cube when a surface is detected
  });

  if (!visible) return null; // hide cube until hit-test detects a surface

  return (
    <group position={hitPosition.current}>
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
      <ARCanvas sessionInit={{ requiredFeatures: ["hit-test"] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.5, 1, 0.5]} intensity={1} />
        <CubeWithLabel />
      </ARCanvas>
    </div>
  );
};

export default Home;
