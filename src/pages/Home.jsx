import React, { useState, useEffect, useRef, useMemo } from "react";
import { XRCanvas, ARButton, useHitTest } from "@react-three/xr";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";

// Simple Box component (same visuals as your original) but positioned relative to an anchor
const Box = ({ position, height, color, label, labelColor }) => {
  return (
    <mesh position={[position[0], height / 2, position[1]]}>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial color={color} />
      <Text
        position={[0, height / 2 + 0.35, 0]}
        fontSize={0.35}
        color={labelColor}
        anchorX="center"
        anchorY="bottom"
      >
        {label}
      </Text>
    </mesh>
  );
};

// Reticle that uses hit testing to show where the user can place the visualization
function Reticle({ onPlace }) {
  const hit = useHitTest();
  const ref = useRef();

  useEffect(() => {
    if (!hit) return;
    const sub = hit.subscribe((pose) => {
      const xrPose = pose.getPose ? pose.getPose() : pose;
      if (!xrPose) return;
      const pos = new THREE.Vector3().fromArray(
        xrPose.transform.position || xrPose.position || [0, 0, 0]
      );
      const rot = new THREE.Quaternion().fromArray(
        xrPose.transform.orientation || xrPose.orientation || [0, 0, 0, 1]
      );
      if (ref.current) {
        ref.current.position.copy(pos);
        ref.current.quaternion.copy(rot);
        ref.current.visible = true;
      }
    });

    return () => sub.unsubscribe && sub.unsubscribe();
  }, [hit]);

  // on tap: place
  useEffect(() => {
    const onSelect = (e) => {
      if (!ref.current) return;
      onPlace(ref.current.position.clone(), ref.current.quaternion.clone());
    };
    window.addEventListener("select", onSelect);
    return () => window.removeEventListener("select", onSelect);
  }, [onPlace]);

  return (
    <mesh ref={ref} visible={false}>
      <ringGeometry args={[0.15, 0.22, 32]} />
      <meshBasicMaterial transparent opacity={0.8} depthWrite={false} />
    </mesh>
  );
}

const Visualize3dAR = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [placed, setPlaced] = useState(false);
  const anchorRef = useRef({
    position: new THREE.Vector3(0, 0, -1.5),
    quaternion: new THREE.Quaternion(),
  });
  const shouldStopRef = useRef(false);

  useEffect(() => {
    generateArray();
  }, []);

  const generateArray = () => {
    let temp = [];
    for (let i = 0; i < 10; i++) temp.push(Math.floor(Math.random() * 100) + 1);
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

  // Sorting functions (same logic as you had)
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

  const onPlace = (position, quaternion) => {
    anchorRef.current.position.copy(position);
    anchorRef.current.quaternion.copy(quaternion);
    setPlaced(true);
  };

  // Label color depends on device preference
  const labelColor =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "white"
      : "black";

  return (
    <div className="h-screen w-screen relative">
      {/* XR Canvas + AR button */}
      <XRCanvas
        raycaster={{ enabled: true }}
        camera={{ position: [0, 1.6, 0] }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[0.5, 1, 0.25]} intensity={0.8} />

        {/* Reticle for placement */}
        <Reticle onPlace={onPlace} />

        {/* Anchored group: this will be placed where the user tapped */}
        {placed && (
          <group
            position={anchorRef.current.position}
            quaternion={anchorRef.current.quaternion}
            rotation={[0, Math.PI, 0]}
            scale={[0.7, 0.7, 0.7]}
          >
            {/* Ground plane so users can see orientation */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <planeGeometry args={[6, 6]} />
              <meshStandardMaterial transparent opacity={0.12} />
            </mesh>

            {/* visualization boxes (arranged along X) */}
            {array.map((value, i) => {
              let color = "#00ffff";
              if (sortedIndices.includes(i)) color = "#7fff00";
              else if (active.includes(i)) color = "#ff8c00";

              return (
                <Box
                  key={i}
                  position={[i * 1.15 - (array.length * 1.15) / 2 + 0.6, 0, 0]}
                  height={value / 15}
                  color={color}
                  label={value}
                  labelColor={labelColor}
                />
              );
            })}
          </group>
        )}
      </XRCanvas>

      {/* AR launch button provided by @react-three/xr. It's independent on-screen. */}
      <div className="absolute left-4 top-4 z-50">
        <ARButton />
      </div>

      {/* Controls overlay (HTML) - accessible while in AR session or in preview */}
      <div className="absolute right-4 top-20 z-50 flex flex-col gap-3 p-3">
        <button
          onClick={generateArray}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition bg-white/60 backdrop-blur"
        >
          Generate Array
        </button>
        <button
          onClick={bubbleSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition bg-white/60 backdrop-blur"
        >
          Bubble Sort
        </button>
        <button
          onClick={selectionSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition bg-white/60 backdrop-blur"
        >
          Selection Sort
        </button>
        <button
          onClick={insertionSort}
          disabled={sorting}
          className="border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition bg-white/60 backdrop-blur"
        >
          Insertion Sort
        </button>
        <button
          onClick={stopSorting}
          className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition bg-white/60 backdrop-blur"
        >
          Stop / Reset
        </button>
      </div>

      {/* Small instruction at bottom */}
      <div className="absolute left-0 right-0 bottom-6 text-center z-50 pointer-events-none">
        <div className="inline-block bg-black/60 text-white text-sm px-3 py-1 rounded pointer-events-none">
          Tap the AR button, move device to find a surface, then tap the screen
          to place the visualizer.
        </div>
      </div>
    </div>
  );
};

export default Visualize3dAR;
