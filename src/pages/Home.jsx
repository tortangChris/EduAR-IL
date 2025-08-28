import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

// Home.jsx
// A simple Three.js (react-three-fiber) scene that displays a horizontal row of boxes
// Each box shows a numeric value and its index label directly below the value.

export default function Home({
  data = [10, 20, 30, 40, 50, 60],
  spacing = 2.0,
}) {
  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full h-screen bg-gray-50">
      <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Row of boxes */}
        {data.map((value, i) => (
          <Box key={i} index={i} value={value} position={positions[i]} />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

function Box({ index, value, position = [0, 0, 0] }) {
  // box size
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      {/* Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      {/* Number shown on the front face (3D text) */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.35}
        maxWidth={2}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {String(value)}
      </Text>

      {/* Index shown below the value on the front face */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        maxWidth={2}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {`[${index}]`}
      </Text>
    </group>
  );
}
