import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// Array Box Component
const ArrayBox = ({ position, value, index, isSelected, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // REMOVED AUTO ROTATION

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.8, 0.6, 0.5]} />
        <meshStandardMaterial
          color={
            isSelected
              ? "#facc15"
              : hovered
                ? "#a78bfa"
                : index % 2 === 0
                  ? "#60a5fa"
                  : "#34d399"
          }
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <Text
        position={[0, 0, 0.26]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      <Text
        position={[0, -0.4, 0.26]}
        fontSize={0.15}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {isSelected && (
        <>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.12}
            color="#fde68a"
            anchorX="center"
            anchorY="middle"
          >
            Value {value} at index {index}
          </Text>
          <mesh>
            <boxGeometry args={[0.85, 0.65, 0.55]} />
            <meshBasicMaterial
              color="#facc15"
              wireframe
              opacity={0.5}
              transparent
            />
          </mesh>
        </>
      )}
    </group>
  );
};

// Definition Panel Component
const DefinitionPanel = ({ selectedBox, data, position, page, onNext }) => {
  const content = [
    `Index: ${selectedBox}\nValue: ${data[selectedBox]}\nIndexes start from 0`,
    `Array Property:\nAccess time: O(1)\nContiguous memory`,
    `Summary:\n${data.map((v, i) => `[${i}]→${v}`).join(" ")}`,
  ];

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 2]} />
        <meshBasicMaterial
          color="#1f2937"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Text
        position={[0, 0.3, 0]}
        fontSize={0.1}
        color="#fde68a"
        anchorX="center"
        anchorY="top"
        maxWidth={2.2}
        lineHeight={1.2}
      >
        {content[page]}
      </Text>

      <group position={[0, -0.6, 0]}>
        <mesh onClick={onNext}>
          <planeGeometry args={[1, 0.35]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {page < 2 ? "Next ▶" : "Close ✖"}
        </Text>
      </group>
    </group>
  );
};

// Array Structure Component
const ArrayStructure = ({
  data,
  selectedBox,
  onSelectBox,
  page,
  onNextPage,
  isPlaced,
  position,
}) => {
  const groupRef = useRef();
  const spacing = 1.2;
  const mid = (data.length - 1) / 2;

  // REMOVED AUTO ROTATION - now static

  return (
    <group ref={groupRef} position={position}>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Array Data Structure
      </Text>

      {data.map((value, index) => (
        <ArrayBox
          key={index}
          position={[(index - mid) * spacing, 0, 0]}
          value={value}
          index={index}
          isSelected={selectedBox === index}
          onSelect={() => onSelectBox(index)}
        />
      ))}

      {!isPlaced && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {selectedBox !== null && (
        <DefinitionPanel
          selectedBox={selectedBox}
          data={data}
          position={[3.5, 0, 0]}
          page={page}
          onNext={onNextPage}
        />
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.31, 0]}
        receiveShadow
      >
        <planeGeometry args={[data.length * spacing + 1, 2]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </group>
  );
};

// WebXR Scene Handler
const WebXRScene = ({ children, onPlacement }) => {
  const { gl, scene } = useThree();
  const reticleRef = useRef();
  const hitTestSourceRef = useRef();
  const sessionRef = useRef();

  useEffect(() => {
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    return () => {
      scene.remove(reticle);
    };
  }, [scene]);

  useEffect(() => {
    const onSessionStart = async () => {
      const session = gl.xr.getSession();
      if (!session) return;

      sessionRef.current = session;

      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSourceRef.current = hitTestSource;

      const onSelect = () => {
        if (reticleRef.current && reticleRef.current.visible) {
          const position = new THREE.Vector3();
          position.setFromMatrixPosition(reticleRef.current.matrix);
          onPlacement?.(position);
        }
      };

      session.addEventListener("select", onSelect);

      const onEnd = () => {
        session.removeEventListener("select", onSelect);
        hitTestSourceRef.current = null;
      };

      session.addEventListener("end", onEnd);
    };

    if (gl.xr.isPresenting) {
      onSessionStart();
    }
  }, [gl.xr, onPlacement]);

  useFrame((state, delta, frame) => {
    if (!frame || !hitTestSourceRef.current || !reticleRef.current) return;

    const referenceSpace = gl.xr.getReferenceSpace();
    const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      if (pose) {
        reticleRef.current.visible = true;
        reticleRef.current.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      reticleRef.current.visible = false;
    }
  });

  return <>{children}</>;
};

// Main AR Array Detector Component
const ARArrayDetector = () => {
  const [data] = useState([10, 20, 30, 40]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [page, setPage] = useState(0);
  const [isPlaced, setIsPlaced] = useState(false);
  const [arrayPosition, setArrayPosition] = useState([0, 0, -2]);
  const canvasRef = useRef();

  const handleStartAR = async () => {
    if (!navigator.xr) {
      alert(
        "WebXR is not supported on this device/browser. Please use Chrome on Android.",
      );
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        alert(
          "AR is not supported on this device. Make sure you're using Chrome on Android.",
        );
        return;
      }

      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body },
      });

      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        const gl = canvas.getContext("webgl2", { xrCompatible: true });
        await session.updateRenderState({
          baseLayer: new XRWebGLLayer(session, gl),
        });
      }
    } catch (error) {
      console.error("AR Error:", error);
      alert("Failed to start AR. Error: " + error.message);
    }
  };

  const handlePlacement = (position) => {
    setArrayPosition([position.x, position.y, position.z]);
    setIsPlaced(true);
  };

  const handleNextClick = () => {
    if (page < 2) {
      setPage(page + 1);
    } else {
      setSelectedBox(null);
      setPage(0);
    }
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      ref={canvasRef}
    >
      {/* Instructions Overlay */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "16px 24px",
          borderRadius: "12px",
          textAlign: "center",
          zIndex: 999,
          maxWidth: "90%",
        }}
      >
        <h3
          style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "bold" }}
        >
          AR Array Visualizer
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#d1d5db" }}>
          {!isPlaced
            ? "Tap to place array on surface"
            : "Tap boxes to learn about arrays"}
        </p>
      </div>

      {/* AR Start Button */}
      <button
        onClick={handleStartAR}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "14px 28px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 1000,
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        }}
      >
        🎯 Start AR
      </button>

      {/* Next Button (appears when box is selected) */}
      {selectedBox !== null && (
        <button
          onClick={handleNextClick}
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          }}
        >
          {page < 2 ? "Next ▶" : "Close ✖"}
        </button>
      )}

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
        }}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <WebXRScene onPlacement={handlePlacement}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[0, 2, 0]} intensity={0.5} />

          <ArrayStructure
            data={data}
            selectedBox={selectedBox}
            onSelectBox={setSelectedBox}
            page={page}
            onNextPage={handleNextClick}
            isPlaced={isPlaced}
            position={arrayPosition}
          />
        </WebXRScene>
      </Canvas>
    </div>
  );
};

export default ARArrayDetector;
