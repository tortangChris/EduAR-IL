import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/* ================= ARRAY BOX ================= */
const ArrayBox = ({ position, value, index, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
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
        />
      </mesh>

      <Text position={[0, 0, 0.26]} fontSize={0.3} color="white">
        {value}
      </Text>

      <Text position={[0, -0.4, 0.26]} fontSize={0.15} color="#fde68a">
        [{index}]
      </Text>
    </group>
  );
};

/* ================= ARRAY STRUCTURE ================= */
const ArrayStructure = ({
  data,
  selectedBox,
  onSelectBox,
  isPlaced,
  position,
}) => {
  const spacing = 1.2;
  const mid = (data.length - 1) / 2;

  if (!isPlaced) return null;

  return (
    <group position={position}>
      <Text position={[0, 1.3, 0]} fontSize={0.25} color="white">
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
    </group>
  );
};

/* ================= WEBXR HANDLER ================= */
const WebXRScene = ({ onPlacement }) => {
  const { gl, scene } = useThree();
  const reticle = useRef();
  const hitTestSource = useRef(null);

  useEffect(() => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    );
    r.matrixAutoUpdate = false;
    r.visible = false;
    scene.add(r);
    reticle.current = r;

    return () => scene.remove(r);
  }, [scene]);

  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    session.requestReferenceSpace("viewer").then((viewerSpace) => {
      session.requestHitTestSource({ space: viewerSpace }).then((source) => {
        hitTestSource.current = source;
      });
    });

    session.addEventListener("select", () => {
      if (reticle.current.visible) {
        const pos = new THREE.Vector3().setFromMatrixPosition(
          reticle.current.matrix,
        );
        onPlacement(pos);
      }
    });
  }, [gl.xr, onPlacement]);

  useFrame((_, __, frame) => {
    if (!frame || !hitTestSource.current) return;

    const refSpace = gl.xr.getReferenceSpace();
    const hits = frame.getHitTestResults(hitTestSource.current);

    if (hits.length) {
      const pose = hits[0].getPose(refSpace);
      reticle.current.visible = true;
      reticle.current.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.current.visible = false;
    }
  });

  return null;
};

/* ================= MAIN COMPONENT ================= */
const ARArrayDetector = () => {
  const [data] = useState([10, 20, 30, 40]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isPlaced, setIsPlaced] = useState(false);
  const [position, setPosition] = useState([0, 0, -1.5]);
  const glRef = useRef();

  const startAR = async () => {
    if (!navigator.xr) {
      alert("WebXR not supported. Use Chrome Android.");
      return;
    }

    const supported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!supported) {
      alert("AR not supported on this device.");
      return;
    }

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
    });

    glRef.current.xr.setSession(session);
  };

  const placeArray = (pos) => {
    setPosition([pos.x, pos.y, pos.z]);
    setIsPlaced(true);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <button
        onClick={startAR}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "14px 28px",
          fontSize: 18,
          background: "#10b981",
          color: "white",
          borderRadius: 10,
          border: "none",
        }}
      >
        🎯 Start AR
      </button>

      <Canvas
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          glRef.current = gl;
        }}
        camera={{ position: [0, 1.6, 3] }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} />

        <WebXRScene onPlacement={placeArray} />

        <ArrayStructure
          data={data}
          selectedBox={selectedBox}
          onSelectBox={setSelectedBox}
          isPlaced={isPlaced}
          position={position}
        />
      </Canvas>
    </div>
  );
};

export default ARArrayDetector;
