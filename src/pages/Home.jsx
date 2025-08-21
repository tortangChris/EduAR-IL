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

const Visualize3d = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const shouldStopRef = useRef(false);

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

  useEffect(() => {
    // Start the automatic chain when array is generated
    if (array.length > 0) {
      runAllSorts();
    }
  }, [array]);

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

  const runAllSorts = async () => {
    await bubbleSort();
    await delay(800); // pause before next
    generateArray();
    await delay(800);
    await selectionSort();
    await delay(800);
    generateArray();
    await delay(800);
    await insertionSort();
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
      <div className="flex-1">
        <Canvas camera={{ position: [0, 25, 30], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 20, 10]} />
          <OrbitControls />
          {array.map((value, i) => {
            let color = "#00ffff";
            if (sortedIndices.includes(i)) color = "#7fff00";
            else if (active.includes(i)) color = "#ff8c00";

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
    </div>
  );
};

export default Visualize3d;
