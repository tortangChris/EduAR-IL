import React, { useEffect, useRef } from "react";
import * as THREE from "three";

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
    camera.position.z = 10;

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
    const arrows = [];

    for (let i = 0; i < 3; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.x = i * 3; // Space between nodes
      scene.add(node);
      nodes.push(node);

      // Add arrow except for the last node
      if (i < 2) {
        const dir = new THREE.Vector3(1, 0, 0); // arrow direction
        const origin = new THREE.Vector3(i * 3 + 0.75, 0, 0); // arrow start
        const arrowHelper = new THREE.ArrowHelper(dir, origin, 1.5, 0xff0000);
        scene.add(arrowHelper);
        arrows.push(arrowHelper);
      }
    }

    // === Animation Loop ===
    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.005; // Slow rotation for better viewing
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
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
