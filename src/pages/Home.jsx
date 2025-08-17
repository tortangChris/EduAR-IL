import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const Box = ({ position, color }) => (
  <mesh position={position}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const Home = () => {
  const [array, setArray] = useState([]);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);

  useEffect(() => {
    const arr = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 10) + 1
    );
    setArray(arr);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
        <ambientLight />
        <pointLight position={[10, 20, 10]} />
        <OrbitControls />
        {array.map((value, i) => {
          let color = "teal";
          if (sortedIndices.includes(i)) color = "green";
          else if (active.includes(i)) color = "orange";
          return (
            <Box key={i} position={[i * 2 - 10, value / 2, 0]} color={color} />
          );
        })}
      </Canvas>
    </div>
  );
};

export default Home;
