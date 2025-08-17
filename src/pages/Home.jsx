import React from "react";
import { Canvas } from "@react-three/fiber";
import { ARCanvas, DefaultXRControllers } from "@react-three/xr";
import { Text } from "@react-three/drei";

const CubeWithLabel = () => {
  return (
    <>
      {/* Cube */}
      <mesh position={[0, 0, -1]}>
        {" "}
        {/* Slightly in front of camera */}
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.15, -1]} // on top of cube
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
        sessionInit={{ requiredFeatures: ["hit-test"] }} // Enable AR hit-test
        camera={{ position: [0, 0, 0] }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.5, 1, 0.5]} intensity={1} />
        <CubeWithLabel />
        <DefaultXRControllers />
      </ARCanvas>
    </div>
  );
};

export default Home;
