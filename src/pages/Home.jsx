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

/* ================= INFO PANEL ================= */
const DefinitionPanel = ({ selectedBox, data, page, onNext }) => {
  const content = [
    `Index: ${selectedBox}\nValue: ${data[selectedBox]}\nIndexes start at 0`,
    `Array Properties:\n• O(1) access\n• Contiguous memory`,
    `Summary:\n${data.map((v, i) => `[${i}]→${v}`).join(" ")}`,
  ];

  return (
    <group position={[3.5, 0, 0]}>
      <mesh>
        <planeGeometry args={[2.6, 1.8]} />
        <meshBasicMaterial color="#1f2937" transparent opacity={0.9} />
      </mesh>

      <Text
        position={[0, 0.35, 0.01]}
        fontSize={0.12}
        maxWidth={2.2}
        lineHeight={1.3}
      >
        {content[page]}
      </Text>

      <mesh position={[0, -0.6, 0.01]} onClick={onNext}>
        <planeGeometry args={[1, 0.35]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      <Text position={[0, -0.6, 0.02]} fontSize={0.12}>
        {page < 2 ? "Next ▶" : "Close ✖"}
      </Text>
    </group>
  );
};

/* ================= ARRAY STRUCTURE ================= */
const ArrayStructure = ({
  data,
  selectedBox,
  setSelectedBox,
  page,
  nextPage,
  isPlaced,
  position,
}) => {
  const spacing = 1.2;
  const mid = (data.length - 1) / 2;

  return (
    <group position={position}>
      <Text position={[0, 1.4, 0]} fontSize={0.25}>
        Array Data Structure
      </Text>

      {data.map((v, i) => (
        <ArrayBox
          key={i}
          value={v}
          index={i}
          position={[(i - mid) * spacing, 0, 0]}
          isSelected={selectedBox === i}
          onSelect={() => setSelectedBox(i)}
        />
      ))}

      {!isPlaced && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
        </mesh>
      )}

      {selectedBox !== null && (
        <DefinitionPanel
          selectedBox={selectedBox}
          data={data}
          page={page}
          onNext={nextPage}
        />
      )}
    </group>
  );
};

/* ================= WEBXR HANDLER ================= */
const WebXRScene = ({ onPlace, children }) => {
  const { gl, scene } = useThree();
  const reticle = useRef();
  const hitSource = useRef();

  useEffect(() => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    );
    ring.matrixAutoUpdate = false;
    ring.visible = false;
    scene.add(ring);
    reticle.current = ring;

    return () => scene.remove(ring);
  }, [scene]);

  useFrame((_, __, frame) => {
    if (!frame || !hitSource.current) return;
    const hits = frame.getHitTestResults(hitSource.current);
    if (hits.length) {
      const pose = hits[0].getPose(gl.xr.getReferenceSpace());
      reticle.current.visible = true;
      reticle.current.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.current.visible = false;
    }
  });

  useEffect(() => {
    if (!gl.xr.isPresenting) return;

    const session = gl.xr.getSession();
    session.requestReferenceSpace("viewer").then((space) => {
      session.requestHitTestSource({ space }).then((src) => {
        hitSource.current = src;
      });
    });

    session.addEventListener("select", () => {
      if (reticle.current?.visible) {
        const p = new THREE.Vector3().setFromMatrixPosition(
          reticle.current.matrix,
        );
        onPlace(p);
      }
    });
  }, [gl, onPlace]);

  return <>{children}</>;
};

/* ================= MAIN COMPONENT ================= */
export default function ARArrayDetector() {
  const [data] = useState([10, 20, 30, 40]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [page, setPage] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [pos, setPos] = useState([0, 0, -2]);
  const glRef = useRef();

  const startAR = async () => {
    if (!navigator.xr) {
      alert("WebXR not supported");
      return;
    }

    const supported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!supported) {
      alert("AR not supported on this device");
      return;
    }

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "camera-access"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    });

    glRef.current.xr.setSession(session);
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
          background: "#10b981",
          color: "#fff",
          borderRadius: 12,
          border: "none",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        🎯 Start AR
      </button>

      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.6, 3], fov: 70 }}
        onCreated={({ gl, scene }) => {
          gl.xr.enabled = true;
          gl.setClearColor(0x000000, 0);
          scene.background = null;
          glRef.current = gl;
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <WebXRScene
          onPlace={(p) => {
            setPos([p.x, p.y, p.z]);
            setPlaced(true);
          }}
        >
          <ArrayStructure
            data={data}
            selectedBox={selectedBox}
            setSelectedBox={setSelectedBox}
            page={page}
            nextPage={() =>
              page < 2 ? setPage(page + 1) : (setPage(0), setSelectedBox(null))
            }
            isPlaced={placed}
            position={pos}
          />
        </WebXRScene>
      </Canvas>
    </div>
  );
}
