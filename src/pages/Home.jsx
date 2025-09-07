import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

// Linked List Intro Component
const Home = ({ nodes = [10, 20, 30, 40], spacing = 4 }) => {
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold mb-4">Introduction to Linked Lists</h1>

      <div className="w-full h-[80%]">
        <Canvas camera={{ position: [12, 6, 12], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />

          {/* Render nodes */}
          {nodes.map((val, i) => (
            <NodeBox
              key={i}
              value={val}
              position={[i * spacing, 0, 0]}
              showArrow={i < nodes.length - 1}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

// Node Box = [Data | Next]
const NodeBox = ({ value, position, showArrow }) => {
  const size = [2, 1, 1]; // box size
  return (
    <group position={position}>
      {/* Data part */}
      <mesh position={[-0.6, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <Text position={[-0.6, 0, 0.55]} fontSize={0.3} color="white">
        {value}
      </Text>

      {/* Pointer part */}
      <mesh position={[0.9, 0, 0]}>
        <boxGeometry args={[0.8, 1, 1]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      <Text position={[0.9, 0, 0.55]} fontSize={0.25} color="white">
        Next
      </Text>

      {/* Arrow to next node */}
      {showArrow && <Arrow from={[1.7, 0, 0]} to={[3, 0, 0]} />}
    </group>
  );
};

// Simple arrow using a thin box
const Arrow = ({ from, to }) => {
  const midX = (from[0] + to[0]) / 2;
  const length = to[0] - from[0];
  return (
    <group>
      <mesh position={[midX, from[1], from[2]]}>
        <boxGeometry args={[length, 0.1, 0.1]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {/* Arrowhead */}
      <mesh position={[to[0], to[1], to[2]]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.2, 0.5, 4]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
};

export default Home;
