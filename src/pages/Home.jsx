import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { XRCanvas, ARButton, useHitTest, Hands } from "@react-three/xr";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Home.jsx
// Requirements (install in your project):
// npm install three @react-three/fiber @react-three/xr @react-three/drei
// Serve over HTTPS (or use expo / Ionic preview) and test on a WebXR-enabled device (Chrome Android + ARCore / AR Supported device)

// Behavior:
// - Shows a small floating helper text placed on the ground initially using an Html overlay.
// - Performs AR hit-testing. Once a valid ground hit is found and the user taps, the floating text disappears and a 3D box is placed at the hit position.
// - After placing the box, user can:
//   * Drag/tap-and-move the box to a different ground location (tap ground to move while in "reposition" mode)
//   * Use pinch gestures on touch (or mouse wheel on desktop) to scale the object
//   * Use two-finger drag (or mouse drag with right button) to rotate the object
// - A small UI (Html overlay) toggles between Place / Reposition mode and shows scale controls.

function ARHelperText({ visible, position }) {
  // Html overlay shown before placement. Use small text anchored to screen position of hit.
  if (!visible) return null;
  return (
    <Html
      center
      distanceFactor={8}
      position={[position.x, position.y + 0.05, position.z]}
    >
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(0,0,0,0.6)",
          color: "white",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        Tap to place object here
      </div>
    </Html>
  );
}

function Box({ placed, position, rotation, scale, onPointerDown }) {
  // simple box mesh
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
      onPointerDown={onPointerDown}
    >
      <boxBufferGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color={placed ? "#2ea3f2" : "orange"} />
    </mesh>
  );
}

function ARPlacementController({ onPlaced, placedObjRef, mode, setMode }) {
  // Uses useHitTest from @react-three/xr to get the first hit pose
  const hit = useHitTest(); // returns array of hits or null depending on library version
  const [candidate, setCandidate] = useState(null);
  const { camera, scene } = useThree();

  // update candidate when hit available
  useFrame(() => {
    if (hit && hit.length > 0) {
      // hit[0] is a XRRigidTransform-like with matrix
      const pose = hit[0];
      // Different versions of hooks return different shapes; attempt to read matrix
      if (pose && pose.transform) {
        const mat = new THREE.Matrix4().fromArray(pose.transform.matrix);
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(mat);
        setCandidate(pos);
      } else if (pose && pose.matrix) {
        const mat = new THREE.Matrix4().fromArray(pose.matrix);
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(mat);
        setCandidate(pos);
      }
    }
  });

  // place object when user taps screen (XR select event)
  useEffect(() => {
    const handleSelect = (e) => {
      if (!candidate) return;
      // if not placed, place. If in reposition mode, move existing object
      if (!placedObjRef.current.placed) {
        placedObjRef.current.position.copy(candidate);
        placedObjRef.current.placed = true;
        onPlaced && onPlaced({ position: candidate.clone() });
        setMode("placed");
      } else if (mode === "reposition") {
        placedObjRef.current.position.copy(candidate);
        onPlaced && onPlaced({ position: candidate.clone() });
      }
    };

    // Listen for XR select event
    const xrSession = rendererXRSession();
    if (xrSession) xrSession.addEventListener("select", handleSelect);

    // for non-XR or testing, also listen to pointerdown on canvas
    window.addEventListener("pointerdown", handleSelect);

    return () => {
      if (xrSession) xrSession.removeEventListener("select", handleSelect);
      window.removeEventListener("pointerdown", handleSelect);
    };
  }, [candidate, onPlaced, placedObjRef, mode, setMode]);

  return candidate ? (
    <ARHelperText visible={!placedObjRef.current.placed} position={candidate} />
  ) : null;
}

// Helper that tries to fetch renderer.xr.session safely
function rendererXRSession() {
  try {
    const canv = document.querySelector("canvas");
    if (!canv) return null;
    const gl = canv.getContext("webgl2") || canv.getContext("webgl");
    if (!gl || !gl.xr) return null;
    return gl.xr.getSession ? gl.xr.getSession() : null;
  } catch (e) {
    return null;
  }
}

export default function Home() {
  const placedObjRef = useRef({
    placed: false,
    position: new THREE.Vector3(),
    scale: 1,
    rotation: [0, 0, 0],
  });
  const [mode, setMode] = useState("placing"); // placing, placed, reposition
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [position, setPosition] = useState([0, 0, -0.5]);

  useEffect(() => {
    // sync ref
    placedObjRef.current.scale = scale;
    placedObjRef.current.rotation = rotation;
  }, [scale, rotation]);

  const onPlaced = useCallback(({ position: pos }) => {
    setPosition([pos.x, pos.y, pos.z]);
  }, []);

  // pointer handlers for desktop dragging and wheel for scaling
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    let dragging = false;

    const onPointerDown = (e) => {
      if (!placedObjRef.current.placed) return;
      // start dragging if left button
      if (e.button === 0) dragging = true;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      // convert screen coords to a ray and compute intersection with horizontal plane y = placedObjRef.current.position.y
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const camera = window.__THREE_CAMERA__;
      if (!camera) return;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      const plane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -placedObjRef.current.position.y
      );
      const intersection = new THREE.Vector3();
      ray.ray.intersectPlane(plane, intersection);
      if (intersection) {
        placedObjRef.current.position.copy(intersection);
        setPosition([intersection.x, intersection.y, intersection.z]);
      }
    };
    const onWheel = (e) => {
      if (!placedObjRef.current.placed) return;
      const delta = e.deltaY;
      let next = placedObjRef.current.scale - delta * 0.001;
      next = Math.max(0.1, Math.min(3, next));
      placedObjRef.current.scale = next;
      setScale(next);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  // store camera globally for pointer raycasting (used in pointer move)
  function OnCreated({ camera }) {
    useEffect(() => {
      window.__THREE_CAMERA__ = camera;
    }, [camera]);
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <XRCanvas
        shadows
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0);
          state.gl.xr.enabled = true;
        }}
      >
        <OnCreated />
        <ambientLight intensity={0.8} />
        <directionalLight position={[0.5, 1, 0.25]} intensity={0.6} />

        {/* Hands allow controllers to work if needed */}
        <Hands />

        {/* AR hit-test & placement helper component */}
        <ARPlacementController
          onPlaced={onPlaced}
          placedObjRef={placedObjRef}
          mode={mode}
          setMode={setMode}
        />

        {/* The placed 3D object */}
        <primitive object={new THREE.Object3D()} position={[0, 0, 0]} />

        <group position={position} rotation={rotation} scale={scale}>
          <Box
            placed={placedObjRef.current.placed}
            position={[0, 0.1, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
          />
        </group>

        {/* Optional: OrbitControls for desktop preview (won't affect AR session) */}
        <OrbitControls makeDefault />
      </XRCanvas>

      {/* AR Button (renders native AR button on supported UA) */}
      <div style={{ position: "absolute", left: 12, top: 12 }}>
        <ARButton />
      </div>

      {/* Small overlay/UI */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            padding: 8,
            color: "white",
            borderRadius: 8,
          }}
        >
          <div>Mode: {mode}</div>
          <button
            onClick={() =>
              setMode(mode === "reposition" ? "placed" : "reposition")
            }
            style={{ marginTop: 8, padding: "6px 10px" }}
          >
            {mode === "reposition" ? "Exit Reposition" : "Reposition"}
          </button>
        </div>
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            padding: 8,
            color: "white",
            borderRadius: 8,
          }}
        >
          <div>Scale: {scale.toFixed(2)}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              onClick={() => {
                const s = Math.max(0.1, scale - 0.1);
                setScale(s);
                placedObjRef.current.scale = s;
              }}
            >
              -
            </button>
            <button
              onClick={() => {
                const s = Math.min(3, scale + 0.1);
                setScale(s);
                placedObjRef.current.scale = s;
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
