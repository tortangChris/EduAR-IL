import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { XR, ARButton, Controllers, useHitTest } from "@react-three/xr";
import * as THREE from "three";

// Single bar
const Box = ({ position, height, color, label, labelColor }) => (
  <mesh position={[position[0], height / 2, position[1]]}>
    <boxGeometry args={[0.5, height, 0.5]} />
    <meshStandardMaterial color={color} />
    <Text
      position={[0, height / 2 + 0.2, 0]}
      fontSize={0.2}
      color={labelColor}
      anchorX="center"
      anchorY="bottom"
    >
      {label}
    </Text>
  </mesh>
);

// Reticle component using hit-test
const Reticle = ({ onSelect }) => {
  const ref = useRef();

  useHitTest((hitMatrix) => {
    hitMatrix.decompose(
      ref.current.position,
      ref.current.quaternion,
      ref.current.scale
    );
    ref.current.visible = true;
  });

  return (
    <mesh ref={ref} visible={false} onClick={onSelect}>
      <ringGeometry args={[0.05, 0.08, 32]} />
      <meshBasicMaterial color="lime" />
    </mesh>
  );
};

const Visualize3dAR = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [anchor, setAnchor] = useState(null); // AR placement point
  const shouldStopRef = useRef(false);

  useEffect(() => {
    generateArray();
  }, []);

  const generateArray = () => {
    let temp = [];
    for (let i = 0; i < 10; i++) {
      temp.push(Math.floor(Math.random() * 100) + 1);
    }
    setArray(temp);
    setSortedIndices([]);
    setActive([-1, -1]);
    setSorting(false);
    shouldStopRef.current = false;
  };

  // Delay helper
  const delay = (ms) =>
    new Promise((res) => {
      let start = Date.now();
      const check = () => {
        if (shouldStopRef.current) res("stopped");
        else if (Date.now() - start >= ms) res("done");
        else requestAnimationFrame(check);
      };
      check();
    });

  const stopSorting = () => {
    shouldStopRef.current = true;
    setSorting(false);
    setActive([-1, -1]);
    setSortedIndices([]);
  };

  // Example: bubble sort
  const bubbleSort = async () => {
    setSorting(true);
    shouldStopRef.current = false;
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (shouldStopRef.current) return;
        setActive([j, j + 1]);
        if ((await delay(300)) === "stopped") return;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          if ((await delay(300)) === "stopped") return;
        }
      }
      setSortedIndices((prev) => [...prev, n - i - 1]);
    }
    setSortedIndices((prev) => [...prev, 0]);
    setActive([-1, -1]);
    setSorting(false);
  };

  // Called when user taps reticle
  const placeArray = (pos, quat) => {
    setAnchor({ position: pos.clone(), quaternion: quat.clone() });
  };

  return (
    <>
      <ARButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 2, 2]} />
          <Controllers />

          {/* Reticle for placement */}
          <Reticle
            onSelect={(e) => {
              const obj = e.eventObject;
              placeArray(obj.position, obj.quaternion);
            }}
          />

          {/* Show bars if anchor placed */}
          {anchor &&
            array.map((value, i) => {
              let color = "#00ffff";
              if (sortedIndices.includes(i)) color = "#7fff00";
              else if (active.includes(i)) color = "#ff8c00";

              let labelColor = "black";

              const spacing = 0.6;
              const offset = (i - array.length / 2) * spacing;

              // Apply anchor transform
              const pos = new THREE.Vector3(offset, 0, 0)
                .applyQuaternion(anchor.quaternion)
                .add(anchor.position);

              return (
                <Box
                  key={i}
                  position={[pos.x, pos.z]} // since AR plane is X-Z
                  height={value / 15}
                  color={color}
                  label={value}
                  labelColor={labelColor}
                />
              );
            })}
        </XR>
      </Canvas>

      {/* UI */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <button
          onClick={generateArray}
          disabled={sorting}
          className="border px-2 py-1 bg-white"
        >
          Generate
        </button>
        <button
          onClick={bubbleSort}
          disabled={sorting}
          className="border px-2 py-1 bg-white"
        >
          Bubble Sort
        </button>
        <button onClick={stopSorting} className="border px-2 py-1 bg-white">
          Stop / Reset
        </button>
      </div>
    </>
  );
};

export default Visualize3dAR;
