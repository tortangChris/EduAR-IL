import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { Play, RotateCcw } from "lucide-react";
import { XR, useXR } from "@react-three/xr"; // ✅ corrected import
import { createXRStore } from "@react-three/xr";

const Home = ({ stepDuration = 700 }) => {
  const initialArray = useRef(generateRandomArray(7));
  const [boxes, setBoxes] = useState(createBoxes(initialArray.current));
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function generateRandomArray(n) {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1);
  }

  function createBoxes(arr, currentIdx = -1, sorted = -1, comparing = -1) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((val, i) => {
      let color = "#3b82f6"; // default unsorted
      if (i <= sorted) color = "#22c55e"; // green sorted
      if (i === currentIdx) color = "#f59e0b"; // current key
      if (i === comparing) color = "#f97316"; // comparing element
      return {
        id: `b${i}`,
        value: val,
        x: (i - mid) * 2.0,
        color,
      };
    });
  }

  const resetArray = () => {
    animRef.current.cancelled = true;
    initialArray.current = generateRandomArray(7);
    setBoxes(createBoxes(initialArray.current));
    setProgress(0);
    setStatus("Idle");
    setIsPlaying(false);
  };

  const sortArray = async () => {
    if (isPlaying) return;
    animRef.current.cancelled = false;
    setIsPlaying(true);
    let arr = initialArray.current.slice();
    setStatus("Sorting...");

    const steps = [];
    const n = arr.length;

    // Insertion Sort step recording
    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;

      steps.push({ arr: arr.slice(), currentIdx: i, sorted: i - 1 });

      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        steps.push({
          arr: arr.slice(),
          currentIdx: i,
          sorted: i - 1,
          comparing: j,
        });
        j--;
      }
      arr[j + 1] = key;
      steps.push({ arr: arr.slice(), currentIdx: i, sorted: i });
    }

    steps.push({ arr: arr.slice(), currentIdx: -1, sorted: n - 1 });

    // Play animation
    for (let step = 0; step < steps.length; step++) {
      if (animRef.current.cancelled) break;
      const { arr, currentIdx, sorted, comparing } = steps[step];
      setBoxes(createBoxes(arr, currentIdx, sorted, comparing));
      setProgress(Math.round(((step + 1) / steps.length) * 100));
      await new Promise((res) => setTimeout(res, stepDuration));
    }

    setStatus("Sorted!");
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-2/3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={sortArray}
            disabled={isPlaying}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Play size={20} />
          </button>
          <button
            onClick={resetArray}
            className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="w-full h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-black font-mono text-sm text-center">
          {status}
        </div>

        {/* Indicator for AR availability */}
        <div className="mt-3 text-center text-sm">
          {"xr" in navigator
            ? "✅ AR Mode available. Use your device’s AR button to view on a surface."
            : "❌ AR Mode not supported on this device/browser."}
        </div>
      </div>

      <div className="w-full h-[75%]">
        <Canvas
          camera={{ position: [0, 40, 40], fov: 50 }}
          gl={{ preserveDrawingBuffer: false }}
        >
          <XR>
            <Scene boxes={boxes} />
          </XR>
        </Canvas>
      </div>
    </div>
  );
};

const Scene = ({ boxes }) => {
  const { isPresenting } = useXR();

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />

      {boxes.map((b) => (
        <Box
          key={b.id}
          value={b.value}
          position={[b.x, 0, 0]}
          height={b.value}
          color={b.color}
        />
      ))}

      {/* Static ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {!isPresenting && <OrbitControls makeDefault />}
    </>
  );
};

const Box = ({ value, position, height, color }) => {
  const size = [1.2, height / 12, 1.2];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, size[1] + 0.5, 0]}
        fontSize={0.4}
        anchorX="center"
        anchorY="middle"
        color="#000000"
      >
        {value}
      </Text>
    </group>
  );
};

export default Home;
