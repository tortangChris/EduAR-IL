import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const Box = ({ position, height, color, label, labelColor }) => (
  <mesh position={[position[0], height / 2, position[1]]}>
    <boxGeometry args={[1, height, 1]} />
    <meshStandardMaterial color={color} />
    <Text
      position={[0, height / 2 + 0.3, 0]}
      fontSize={0.4}
      color={labelColor}
      anchorX="center"
      anchorY="bottom"
    >
      {label}
    </Text>
  </mesh>
);

const Home3D = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const shouldStopRef = useRef(false);

  // Detect orientation
  const checkOrientation = () =>
    setIsPortrait(window.innerHeight > window.innerWidth);

  useEffect(() => {
    generateArray();
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
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

  const bubbleSort = async () => {
    setSorting(true);
    shouldStopRef.current = false;
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (shouldStopRef.current) return;
        setActive([j, j + 1]);
        if ((await delay(400)) === "stopped") return;
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          if ((await delay(400)) === "stopped") return;
        }
      }
      setSortedIndices((prev) => [...prev, n - i - 1]);
    }
    setSortedIndices((prev) => [...prev, 0]);
    setActive([-1, -1]);
    setSorting(false);
  };

  const selectionSort = async () => {
    setSorting(true);
    shouldStopRef.current = false;
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n; i++) {
      if (shouldStopRef.current) return;
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (shouldStopRef.current) return;
        setActive([minIdx, j]);
        if ((await delay(400)) === "stopped") return;
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setActive([i, minIdx]);
          if ((await delay(400)) === "stopped") return;
        }
      }
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      setArray([...arr]);
      setSortedIndices((prev) => [...prev, i]);
      if ((await delay(400)) === "stopped") return;
    }
    setActive([-1, -1]);
    setSorting(false);
  };

  const insertionSort = async () => {
    setSorting(true);
    shouldStopRef.current = false;
    let arr = [...array];
    let n = arr.length;

    for (let i = 1; i < n; i++) {
      if (shouldStopRef.current) return;
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        if (shouldStopRef.current) return;
        setActive([j, j + 1]);
        if ((await delay(400)) === "stopped") return;
        arr[j + 1] = arr[j];
        setArray([...arr]);
        j--;
      }
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices([...Array(i + 1).keys()]);
      if ((await delay(400)) === "stopped") return;
    }

    setActive([-1, -1]);
    setSorting(false);
  };

  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas camera={{ position: [0, 25, 30], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 20, 10]} />
          <OrbitControls />
          {array.map((value, i) => {
            // Fixed bar colors
            let color = "#00ffff"; // default
            if (sortedIndices.includes(i)) color = "#7fff00";
            else if (active.includes(i)) color = "#ff8c00";

            // Label color based on user's theme
            let labelColor = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "white"
              : "black";

            return (
              <Box
                key={i}
                position={[i * 2 - 9, 0]}
                height={value / 15}
                color={color}
                label={value}
                labelColor={labelColor}
              />
            );
          })}
        </Canvas>
      </div>

      {/* Buttons on the right */}
      <div className="flex flex-col gap-4 p-4 justify-center">
        <button
          onClick={generateArray}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition"
        >
          Generate Array
        </button>
        <button
          onClick={bubbleSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition"
        >
          Bubble Sort
        </button>
        <button
          onClick={selectionSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition"
        >
          Selection Sort
        </button>
        <button
          onClick={insertionSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition"
        >
          Insertion Sort
        </button>
        <button
          onClick={stopSorting}
          className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition"
        >
          Stop / Reset
        </button>
      </div>
    </div>
  );
};

export default Home3D;
