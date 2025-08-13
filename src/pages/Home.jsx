import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Function to create number texture
    const createNumberTexture = (number) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 100px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(number, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // Create 8 boxes with random numbers
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 8; i++) {
      const randomValue = Math.floor(Math.random() * 100); // random 0-99

      // Box
      const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x4fc3f7 });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(i * 1.1, 0, 0);
      scene.add(box);

      // Border
      const edges = new THREE.EdgesGeometry(boxGeometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      line.position.copy(box.position);
      scene.add(line);

      // Number sprite inside box
      const numberTexture = createNumberTexture(randomValue);
      const numberMaterial = new THREE.SpriteMaterial({ map: numberTexture });
      const numberSprite = new THREE.Sprite(numberMaterial);
      numberSprite.scale.set(0.8, 0.8, 1); // size of number
      numberSprite.position.set(i * 1.1, 0, 0.51); // slightly in front
      scene.add(numberSprite);
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
