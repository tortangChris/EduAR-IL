import React, { useRef } from "react";
import { ARCanvas, useHitTest } from "@react-three/xr";
import { Text } from "@react-three/drei";
import { Vector3 } from "three";

const CubeWithLabel = () => {
  const hitPosition = useRef(new Vector3());

  useHitTest((hitMatrix) => {
    hitMatrix.decompose(hitPosition.current, new Quaternion(), new Vector3());
  });

  return (
    <>
      <mesh position={hitPosition.current}>
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
    </>
  );
};

const Home = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ARCanvas
        sessionInit={{ requiredFeatures: ["hit-test"] }}
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
