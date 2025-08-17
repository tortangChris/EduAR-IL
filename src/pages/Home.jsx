import React, { useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import * as THREE from "three";

// Single bar box
const Box = ({ position, color, height }) => (
  <mesh position={position}>
    <boxGeometry args={[0.2, height, 0.2]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

// Place your array in AR
const Bars = ({ array, active, sortedIndices }) => {
  return array.map((value, i) => {
    let color = "teal";
    if (sortedIndices.includes(i)) color = "green";
    else if (active.includes(i)) color = "orange";

    // position x based on index, y based on half height, z fixed
    return (
      <Box
        key={i}
        position={[i * 0.25 - array.length * 0.125, value / 2 / 10, -1]}
        color={color}
        height={value / 10}
      />
    );
  });
};

// Canvas wrapper with ARButton
const ARScene = ({ array, active, sortedIndices }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // Enable AR
    gl.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(gl));
  }, [gl]);

  return <Bars array={array} active={active} sortedIndices={sortedIndices} />;
};

const HomeAR = () => {
  const [array, setArray] = useState([5, 8, 3, 6, 2, 9]);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);

  return (
    <Canvas style={{ height: "100vh" }} camera={{ position: [0, 1.5, 3] }}>
      <ambientLight />
      <pointLight position={[5, 5, 5]} />
      <ARScene array={array} active={active} sortedIndices={sortedIndices} />
    </Canvas>
  );
};

export default HomeAR;
