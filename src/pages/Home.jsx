import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

function ARControls({ sceneRootRef, orbitRef }) {
  const { gl } = useThree();
  const arButtonRef = useRef();
  const hitTestSourceRef = useRef(null);
  const localSpaceRef = useRef(null);

  useEffect(() => {
    if (!gl || !gl.domElement) return;
    gl.xr.enabled = true;
    gl.setClearColor(0x000000, 0); // transparent background for camera feed

    const btn = ARButton.createButton(gl, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    });

    btn.style.position = "absolute";
    btn.style.bottom = "20px";
    btn.style.left = "20px";
    btn.style.zIndex = "9999";

    document.body.appendChild(btn);
    arButtonRef.current = btn;

    const xr = gl.xr;

    async function onSessionStart() {
      const session = xr.getSession();
      if (!session) return;

      // disable OrbitControls while in AR
      if (orbitRef?.current) orbitRef.current.enabled = false;

      const viewerSpace = await session.requestReferenceSpace("viewer");
      hitTestSourceRef.current = await session.requestHitTestSource({
        space: viewerSpace,
      });
      localSpaceRef.current = await session.requestReferenceSpace("local");

      gl.setAnimationLoop((timestamp, frame) => {
        if (frame && hitTestSourceRef.current && localSpaceRef.current) {
          const hitTestResults = frame.getHitTestResults(
            hitTestSourceRef.current
          );
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(localSpaceRef.current);
            if (pose && sceneRootRef.current) {
              sceneRootRef.current.visible = true;
              sceneRootRef.current.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              sceneRootRef.current.quaternion.set(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z,
                pose.transform.orientation.w
              );
              sceneRootRef.current.updateMatrixWorld(true);
            }
          }
        }
        gl.render(gl.scene, gl.camera);
      });
    }

    function onSessionEnd() {
      hitTestSourceRef.current = null;
      localSpaceRef.current = null;
      if (orbitRef?.current) orbitRef.current.enabled = true; // re-enable OrbitControls
      gl.setAnimationLoop(null);
    }

    xr.addEventListener("sessionstart", onSessionStart);
    xr.addEventListener("sessionend", onSessionEnd);

    return () => {
      xr.removeEventListener("sessionstart", onSessionStart);
      xr.removeEventListener("sessionend", onSessionEnd);
      if (arButtonRef.current && arButtonRef.current.parentNode) {
        arButtonRef.current.parentNode.removeChild(arButtonRef.current);
      }
    };
  }, [gl, sceneRootRef, orbitRef]);

  return null;
}

const Box = ({ index, value, position = [0, 0, 0] }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

export default function Home({ data = [10, 20, 30, 40], spacing = 2.0 }) {
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const sceneRootRef = useRef();
  const orbitRef = useRef();

  return (
    <div className="w-full h-screen relative">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Group for AR placement */}
        <group ref={sceneRootRef} visible={true}>
          {data.map((value, i) => (
            <Box key={i} index={i} value={value} position={positions[i]} />
          ))}
        </group>

        {/* OrbitControls for preview */}
        <OrbitControls ref={orbitRef} makeDefault />

        {/* AR Controls */}
        <ARControls sceneRootRef={sceneRootRef} orbitRef={orbitRef} />
      </Canvas>
    </div>
  );
}
