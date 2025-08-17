import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, ARButton } from "@react-three/xr";
import { Text } from "@react-three/drei";

/**
 * Simple Box (bar) with label above it.
 */
const Box = ({ position, height, color, label, labelColor }) => {
  const [x, z] = position;
  return (
    <group position={[x, height / 2, z]}>
      <mesh>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <Text
        position={[0, height / 2 + 0.25, 0]}
        fontSize={0.25}
        anchorX="center"
        anchorY="bottom"
        color={labelColor}
      >
        {String(label)}
      </Text>
    </group>
  );
};

const Visualize3dAR = () => {
  const [array, setArray] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    // generate random array at start
    const temp = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArray(temp);

    const checkOrientation = () =>
      setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const labelColor = prefersDark ? "white" : "black";

  return (
    <div className="flex h-screen">
      {/* ARButton for entering AR */}
      <ARButton
        sessionInit={{
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: document.body },
        }}
      />

      <Canvas camera={{ position: [0, 1.6, 0], fov: 50 }}>
        <XR>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          <Suspense fallback={null}>
            <group position={[0, 0, -1]}>
              {array.map((value, i) => (
                <Box
                  key={i}
                  position={[i * 2 - 9, 0]} // spread along X
                  height={Math.max(0.3, value / 15)}
                  color={"#00ffff"}
                  label={value}
                  labelColor={labelColor}
                />
              ))}
            </group>
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
};

export default Visualize3dAR;
