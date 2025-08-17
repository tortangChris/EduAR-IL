import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const CubeWithLabel = () => {
  return (
    <>
      {/* Cube */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>

      {/* Label on top */}
      <Text
        position={[0, 2, 0]} // on top of the cube
        fontSize={0.5}
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
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <CubeWithLabel />
        {/* User-controlled rotation and zoom */}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default Home;
