import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, ARButton } from "@react-three/xr";
import { OrbitControls, Text } from "@react-three/drei";

/** Box bar with value label */
const Box = ({ position, height, color, label, labelColor }) => {
  const [x, z] = position;
  return (
    <group position={[x, height / 2, z]}>
      <mesh>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <Text
        position={[0, height / 2 + 0.3, 0]}
        fontSize={0.28}
        anchorX="center"
        anchorY="bottom"
      >
        {String(label)}
      </Text>
    </group>
  );
};

const Visualize3dAR = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const shouldStopRef = useRef(false);

  /** Check AR support + orientation */
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        if (navigator.xr && navigator.xr.isSessionSupported) {
          const supported = await navigator.xr.isSessionSupported(
            "immersive-ar"
          );
          if (mounted) setArSupported(Boolean(supported));
        } else {
          if (mounted) setArSupported(false);
        }
      } catch {
        if (mounted) setArSupported(false);
      }
    };
    check();

    const checkOrientation = () =>
      setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    generateArray();

    return () => {
      mounted = false;
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  /** Generate random array */
  const generateArray = () => {
    const temp = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArray(temp);
    setSortedIndices([]);
    setActive([-1, -1]);
    setSorting(false);
    shouldStopRef.current = false;
  };

  /** Delay with stop support */
  const delay = (ms) =>
    new Promise((res) => {
      const start = Date.now();
      const check = () => {
        if (shouldStopRef.current) res("stopped");
        else if (Date.now() - start >= ms) res("done");
        else requestAnimationFrame(check);
      };
      check();
    });

  /** Stop sorting */
  const stopSorting = () => {
    shouldStopRef.current = true;
    setSorting(false);
    setActive([-1, -1]);
    setSortedIndices([]);
  };

  /** Sorting algorithms */
  const bubbleSort = async () => {
    setSorting(true);
    shouldStopRef.current = false;
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (shouldStopRef.current) return setSorting(false);
        setActive([j, j + 1]);
        if ((await delay(300)) === "stopped") return setSorting(false);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          if ((await delay(300)) === "stopped") return setSorting(false);
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
      if (shouldStopRef.current) return setSorting(false);
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (shouldStopRef.current) return setSorting(false);
        setActive([minIdx, j]);
        if ((await delay(300)) === "stopped") return setSorting(false);
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setActive([i, minIdx]);
          if ((await delay(300)) === "stopped") return setSorting(false);
        }
      }
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      setArray([...arr]);
      setSortedIndices((prev) => [...prev, i]);
      if ((await delay(300)) === "stopped") return setSorting(false);
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
      if (shouldStopRef.current) return setSorting(false);
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        if (shouldStopRef.current) return setSorting(false);
        setActive([j, j + 1]);
        if ((await delay(300)) === "stopped") return setSorting(false);
        arr[j + 1] = arr[j];
        setArray([...arr]);
        j--;
      }
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices([...Array(i + 1).keys()]);
      if ((await delay(300)) === "stopped") return setSorting(false);
    }

    setActive([-1, -1]);
    setSorting(false);
  };

  /** Label color (light/dark mode) */
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const labelColor = prefersDark ? "white" : "black";

  /** Scene content reusable */
  const SceneContents = ({ inAR = false }) => {
    const startX = -9;
    const zOffset = inAR ? -1 : 0;
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          {array.map((value, i) => {
            let color = "#00ffff";
            if (sortedIndices.includes(i)) color = "#7fff00";
            else if (active.includes(i)) color = "#ff8c00";

            return (
              <Box
                key={i}
                position={[i * 2 + startX, zOffset]}
                height={Math.max(0.3, value / 15)}
                color={color}
                label={value}
                labelColor={labelColor}
              />
            );
          })}
        </Suspense>

        {!inAR && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial transparent opacity={0.1} />
          </mesh>
        )}
      </>
    );
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
        {arSupported ? (
          <>
            <ARButton
              sessionInit={{
                requiredFeatures: ["local-floor"],
                optionalFeatures: ["dom-overlay"],
                domOverlay: { root: document.body },
              }}
            />
            <Canvas camera={{ position: [0, 1.6, 0], fov: 50 }}>
              <XR>
                <group position={[0, 0, -1]}>
                  <SceneContents inAR={true} />
                </group>
              </XR>
            </Canvas>
          </>
        ) : (
          <Canvas camera={{ position: [0, 25, 30], fov: 50 }}>
            <OrbitControls />
            <SceneContents inAR={false} />
          </Canvas>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4 justify-center w-80">
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
        <div className="mt-2 text-sm text-gray-600">
          {arSupported ? (
            <p>
              Device can run WebXR AR — press the AR button to start AR mode.
            </p>
          ) : (
            <p>AR not available — showing desktop 3D fallback.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visualize3dAR;
