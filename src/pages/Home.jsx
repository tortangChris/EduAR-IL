import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ARCanvas,
  DefaultXRControllers,
  useHitTest,
  Interactive,
} from "@react-three/xr";
import { Text } from "@react-three/drei";

const CubeWithLabel = () => {
  return (
    <>
      {/* Cube */}
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} /> {/* original size */}
        <meshStandardMaterial color="#4f46e5" />
      </mesh>

      {/* Label on top */}
      <Text
        position={[0, 0.15, 0]} // slightly above cube
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

// Component to handle placing cube on user tap
const ARObjectPlacer = () => {
  const [placed, setPlaced] = useState(false);
  const ref = useRef();

  // Hit-test hook to get tap position
  useHitTest((hit) => {
    if (!placed) {
      ref.current.position.set(hit[0].x, hit[0].y, hit[0].z);
      setPlaced(true); // prevent multiple placements
    }
  });

  return <group ref={ref}>{placed && <CubeWithLabel />}</group>;
};

const Home = () => {
  const [arStarted, setArStarted] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!arStarted && (
        <button
          onClick={() => setArStarted(true)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Enter AR
        </button>
      )}

      {arStarted && (
        <ARCanvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 1.6, 0] }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 5, 0]} intensity={1} />
          <ARObjectPlacer />
          <DefaultXRControllers />
        </ARCanvas>
      )}
    </div>
  );
};

export default Home;
