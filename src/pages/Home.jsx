import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Function to create cube face texture with a number
    const createNumberFace = (number) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#4fc3f7"; // same as cube color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Number text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(number, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return new THREE.MeshPhongMaterial({ map: texture });
    };

    // Create 8 cubes side-by-side
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 8; i++) {
      const randomValue = Math.floor(Math.random() * 100);

      // Materials for all cube faces
      const materials = [
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }), // right
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }), // left
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }), // top
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }), // bottom
        createNumberFace(randomValue), // front face with number
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }), // back
      ];

      const cube = new THREE.Mesh(geometry, materials);
      cube.position.set(i * 1.1, 0, 0);
      scene.add(cube);

      // Add border
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      line.position.copy(cube.position);
      scene.add(line);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-[calc(100vh-4rem)] overflow-hidden bg-base-100"
    ></div>
  );
};

export default Home;
