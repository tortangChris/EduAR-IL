import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // === Scene Setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 10); // Slightly angled view

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // === Lighting ===
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // === Linked List Nodes ===
    const nodeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: 0x2196f3 });

    const nodes = [];
    for (let i = 0; i < 3; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.x = i * 3;
      scene.add(node);
      nodes.push(node);

      // Add arrow except for last node
      if (i < 2) {
        const dir = new THREE.Vector3(1, 0, 0);
        const origin = new THREE.Vector3(i * 3 + 0.75, 0, 0);
        const arrowHelper = new THREE.ArrowHelper(dir, origin, 1.5, 0xff0000);
        scene.add(arrowHelper);
      }
    }

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth motion
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.target.set(3, 0, 0); // Focus on middle node

    // === Animation Loop ===
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Required for damping
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-[calc(100vh-4rem)] overflow-hidden bg-base-100"
    />
  );
};

export default Home;
