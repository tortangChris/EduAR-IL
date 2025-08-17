import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const Box = ({ position, height, color, value }) => (
  <mesh position={[position, height / 2, 0]}>
    <boxGeometry args={[1, height, 1]} />
    <meshStandardMaterial color={color} />
    {/* Number label above the box */}
    <Text
      position={[0, height / 2 + 0.5, 0]}
      fontSize={0.5}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      {value}
    </Text>
  </mesh>
);

const Home3D = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);

  // Detect orientation
  const checkOrientation = () =>
    setIsPortrait(window.innerHeight > window.innerWidth);

  useEffect(() => {
    generateArray();
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const generateArray = () => {
    const temp = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 10) + 1
    );
    setArray(temp);
    setSortedIndices([]);
    setActive([-1, -1]);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const bubbleSort = async () => {
    setSorting(true);
    let arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setActive([j, j + 1]);
        await sleep(800);

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          await sleep(800);
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
    let arr = [...array];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        setActive([minIdx, j]);
        await sleep(800);

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setActive([i, minIdx]);
          await sleep(800);
        }
      }
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      setArray([...arr]);
      setSortedIndices((prev) => [...prev, i]);
      await sleep(800);
    }
    setActive([-1, -1]);
    setSorting(false);
  };

  const insertionSort = async () => {
    setSorting(true);
    let arr = [...array];
    const n = arr.length;

    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        setActive([j, j + 1]);
        await sleep(800);

        arr[j + 1] = arr[j];
        setArray([...arr]);
        j--;
      }
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices([...Array(i + 1).keys()]);
      await sleep(800);
    }

    setActive([-1, -1]);
    setSorting(false);
  };

  if (isPortrait) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "24px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>Sorting Algorithms Visualization (3D)</h1>

      <Canvas camera={{ position: [0, 15, 25], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 20, 10]} />
        <OrbitControls />
        {array.map((value, index) => {
          let color = "teal";
          if (sortedIndices.includes(index)) color = "green";
          else if (active.includes(index)) color = "orange";

          return (
            <Box
              key={index}
              position={index * 2 - 9}
              height={value * 2}
              color={color}
              value={value}
            />
          );
        })}
      </Canvas>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={generateArray} disabled={sorting} style={buttonStyle}>
          Generate New Array
        </button>
        <button onClick={bubbleSort} disabled={sorting} style={buttonStyle}>
          Bubble Sort
        </button>
        <button onClick={selectionSort} disabled={sorting} style={buttonStyle}>
          Selection Sort
        </button>
        <button onClick={insertionSort} disabled={sorting} style={buttonStyle}>
          Insertion Sort
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
};

export default Home3D;
