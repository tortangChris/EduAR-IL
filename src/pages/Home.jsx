import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, useHitTest } from "@react-three/xr";
import { Text } from "@react-three/drei";
import { Vector3, Quaternion } from "three";

const CubeWithLabel = () => {
  const hitPosition = useRef(new Vector3());
  const [visible, setVisible] = useState(false);

  useHitTest((hitMatrix) => {
    hitMatrix.decompose(hitPosition.current, new Quaternion(), new Vector3());
    setVisible(true);
  });

  if (!visible) return null;

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
  const [startAR, setStartAR] = useState(false);

  const handleStartAR = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setStartAR(true);
    } catch (err) {
      alert("Camera access is required for AR");
      console.error(err);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!startAR ? (
        <div className="flex justify-center items-center h-screen">
          <button
            onClick={handleStartAR}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              borderRadius: "0.5rem",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
            }}
          >
            Start AR
          </button>
        </div>
      ) : (
        <Canvas camera={{ position: [0, 0, 0] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0.5, 1, 0.5]} intensity={1} />
          <XR sessionInit={{ requiredFeatures: ["hit-test"] }}>
            <CubeWithLabel />
          </XR>
        </Canvas>
      )}
    </div>
  );
};

export default Home;
