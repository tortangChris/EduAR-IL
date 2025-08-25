// Home.jsx
import React, { useEffect, useState } from "react";
import View3D from "@egjs/react-view3d";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const Home = () => {
  const [modelUrl, setModelUrl] = useState(null);

  useEffect(() => {
    // STEP 1: Gumawa ng Scene
    const scene = new THREE.Scene();

    const material = new THREE.MeshStandardMaterial({ color: "#4fc3f7" });
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Gumawa ng Array[5] (5 cubes)
    for (let i = 0; i < 5; i++) {
      const cube = new THREE.Mesh(geometry, material.clone());
      cube.position.set(i * 1.5, 0, 0);
      cube.name = `array_${i}`;
      scene.add(cube);
    }

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // STEP 2: Export as GLB
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([gltf], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        setModelUrl(url); // ito i-feed sa View3D
      },
      { binary: true }
    );
  }, []);

  return (
    <div style={{ background: "#111", height: "100vh", color: "white" }}>
      <h2 style={{ textAlign: "center", padding: "10px" }}>
        📊 Array in AR (Hybrid Three.js + View3D)
      </h2>

      {/* STEP 3: Load sa View3D */}
      {modelUrl ? (
        <View3D
          src={modelUrl}
          ar
          cameraControls
          style={{ width: "100%", height: "80vh" }}
        />
      ) : (
        <p style={{ textAlign: "center" }}>⏳ Generating 3D Model...</p>
      )}

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <p>
          <b>Access:</b> O(1)
        </p>
        <p>
          <b>Traversal:</b> O(n)
        </p>
      </div>
    </div>
  );
};

export default Home;
