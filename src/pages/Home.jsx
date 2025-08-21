// Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

// ---------- BOX WITH LABEL ----------
const Box = ({ position, height, color, label, labelColor }) => (
  <mesh position={[position[0], height / 2, position[1]]}>
    <boxGeometry args={[0.2, height, 0.2]} />
    <meshStandardMaterial color={color} />
    <Text
      position={[0, height / 2 + 0.15, 0]}
      fontSize={0.15}
      color={labelColor}
      anchorX="center"
      anchorY="bottom"
    >
      {label}
    </Text>
  </mesh>
);

// ---------- RETICLE COMPONENT ----------
const Reticle = React.forwardRef((props, ref) => (
  <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[0.05, 0.06, 32]} />
    <meshBasicMaterial color="lime" opacity={0.7} transparent />
  </mesh>
));

// ---------- MAIN ARRAY VISUALIZER IN AR ----------
const ArrayVisualizer = ({ array, sortedIndices, active, placed }) => {
  return (
    placed && (
      <group position={placed}>
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
              position={[i * 0.25 - array.length * 0.125, 0]}
              height={value / 100}
              color={color}
              label={value}
              labelColor={labelColor}
            />
          );
        })}
      </group>
    )
  );
};

// ---------- AR EXPERIENCE ----------
const ARExperience = ({ array, sortedIndices, active }) => {
  const { gl, scene, camera } = useThree();
  const reticleRef = useRef();
  const [placed, setPlaced] = useState(null);
  const hitTestSource = useRef(null);
  const localSpace = useRef(null);
  const hitTestRequested = useRef(false);

  // Add ARButton
  useEffect(() => {
    gl.xr.enabled = true;
    const button = ARButton.createButton(gl, {
      requiredFeatures: ["hit-test"],
    });
    document.body.appendChild(button);
  }, [gl]);

  // Animation loop: handle hit-test
  useFrame((state, delta, xrFrame) => {
    const session = gl.xr.getSession();
    if (!session) return;

    if (!hitTestRequested.current) {
      session.requestReferenceSpace("viewer").then((refSpace) => {
        session.requestHitTestSource({ space: refSpace }).then((source) => {
          hitTestSource.current = source;
        });
      });
      session.requestReferenceSpace("local").then((refSpace) => {
        localSpace.current = refSpace;
      });
      hitTestRequested.current = true;
    }

    if (hitTestSource.current && xrFrame) {
      const hitTestResults = xrFrame.getHitTestResults(hitTestSource.current);
      if (hitTestResults.length > 0 && localSpace.current) {
        const pose = hitTestResults[0].getPose(localSpace.current);
        if (reticleRef.current) {
          reticleRef.current.visible = true;
          reticleRef.current.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );
          reticleRef.current.updateMatrixWorld(true);
        }
      } else {
        if (reticleRef.current) reticleRef.current.visible = false;
      }
    }
  });

  // Tap to place or replace
  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;
    const onSelect = () => {
      if (reticleRef.current && reticleRef.current.visible) {
        const pos = new THREE.Vector3();
        reticleRef.current.getWorldPosition(pos);
        setPlaced([pos.x, pos.y, pos.z]);
      }
    };
    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [gl]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0.2, 1, 0.3]} intensity={0.6} />
      <Reticle ref={reticleRef} />
      <ArrayVisualizer
        array={array}
        sortedIndices={sortedIndices}
        active={active}
        placed={placed}
      />
    </>
  );
};

// ---------- MAIN HOME COMPONENT ----------
const Home = () => {
  const [array, setArray] = useState([]);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);

  useEffect(() => {
    let temp = [];
    for (let i = 0; i < 10; i++) temp.push(Math.floor(Math.random() * 100) + 1);
    setArray(temp);
  }, []);

  return (
    <Canvas camera={{ fov: 70 }}>
      <ARExperience
        array={array}
        active={active}
        sortedIndices={sortedIndices}
      />
    </Canvas>
  );
};

export default Home;
