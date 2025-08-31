import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

function ARControls({ sceneRootRef, reticleRef }) {
  const { gl, scene, camera } = useThree();
  const arButtonRef = useRef();
  const hitTestSourceRef = useRef(null);
  const localSpaceRef = useRef(null);
  const objectPlacedRef = useRef(false);

  useEffect(() => {
    if (!gl || !gl.domElement) return;
    gl.xr.enabled = true;

    const button = ARButton.createButton(gl, {
      requiredFeatures: ["hit-test"],
    });
    document.body.appendChild(button);
    arButtonRef.current = button;

    const xr = gl.xr;

    async function onSessionStart() {
      const session = xr.getSession();
      if (!session) return;

      const viewerSpace = await session.requestReferenceSpace("viewer");
      hitTestSourceRef.current = await session.requestHitTestSource({
        space: viewerSpace,
      });
      localSpaceRef.current = await session.requestReferenceSpace("local");

      const onSelect = () => {
        if (
          reticleRef.current &&
          sceneRootRef.current &&
          reticleRef.current.visible
        ) {
          sceneRootRef.current.position.copy(reticleRef.current.position);
          sceneRootRef.current.quaternion.copy(reticleRef.current.quaternion);
          sceneRootRef.current.visible = true;
          objectPlacedRef.current = true;
          reticleRef.current.visible = false;
        }
      };

      session.addEventListener("select", onSelect);

      gl.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        if (
          hitTestSourceRef.current &&
          localSpaceRef.current &&
          !objectPlacedRef.current
        ) {
          const hitTestResults = frame.getHitTestResults(
            hitTestSourceRef.current
          );
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(localSpaceRef.current);
            if (pose && reticleRef.current) {
              reticleRef.current.visible = true;
              reticleRef.current.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              reticleRef.current.quaternion.set(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z,
                pose.transform.orientation.w
              );
            }
          } else if (reticleRef.current) {
            reticleRef.current.visible = false;
          }
        }

        gl.render(scene, camera);
      });
    }

    function onSessionEnd() {
      hitTestSourceRef.current = null;
      localSpaceRef.current = null;
      gl.setAnimationLoop(null);
      if (reticleRef.current) reticleRef.current.visible = false;
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
  }, [gl, scene, camera, sceneRootRef, reticleRef]);

  return null;
}

const Reticle = React.forwardRef((props, ref) => {
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.15, 0.25, 32]} />
      <meshBasicMaterial
        color="lime"
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

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
  const reticleRef = useRef();

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        shadows
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* 3D objects hidden until placed */}
        <group ref={sceneRootRef} visible={false}>
          {data.map((value, i) => (
            <Box key={i} index={i} value={value} position={positions[i]} />
          ))}
        </group>

        {/* Reticle for placement */}
        <Reticle ref={reticleRef} />

        <ARControls sceneRootRef={sceneRootRef} reticleRef={reticleRef} />
      </Canvas>
    </div>
  );
}
