import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const spacing = 2;

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // Controls (zoom & rotate)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Initial array
    let values = [1, 3, 5];
    values.forEach((val, i) => {
      const box = createBox(val);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Test animations
    setTimeout(() => appendValue(scene, 8), 2000);
    setTimeout(() => insertValue(scene, 2, 9), 5000);

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const createBox = (value) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    // Text on box
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.font = "100px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(value, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial);
    plane.position.z = 0.51;
    mesh.add(plane);

    return mesh;
  };

  const appendValue = (scene, value) => {
    const box = createBox(value);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5; // start from right
    scene.add(box);
    boxes.current.push(box);

    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

  const insertValue = (scene, index, value) => {
    // Move existing to the right
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i + 1) * spacing,
        duration: 1,
      });
    }

    // Create new box
    const box = createBox(value);
    box.position.x = index * spacing - 5; // start from left
    scene.add(box);
    boxes.current.splice(index, 0, box);

    gsap.to(box.position, { x: index * spacing, duration: 1 });
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
