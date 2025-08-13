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

    // Lights
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Test animations
    setTimeout(() => appendValue(scene, 8), 2000);
    setTimeout(() => insertValue(scene, 2, 9), 5000);
    setTimeout(() => removeValue(scene, 1), 8000);
    setTimeout(() => swapValues(0, 2), 11000);

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // Create box with number text
  const createBox = (value) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    // Add number text
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

  // Append
  const appendValue = (scene, value) => {
    const box = createBox(value);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5;
    scene.add(box);
    boxes.current.push(box);
    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

  // Insert
  const insertValue = (scene, index, value) => {
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i + 1) * spacing,
        duration: 1,
      });
    }
    const box = createBox(value);
    box.position.x = index * spacing - 5;
    scene.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 1 });
  };

  // Remove
  const removeValue = (scene, index) => {
    if (index < 0 || index >= boxes.current.length) return;

    const removedBox = boxes.current[index];

    // Animate out
    gsap.to(removedBox.position, {
      y: -3,
      opacity: 0,
      duration: 1,
      onComplete: () => {
        scene.remove(removedBox);
      },
    });

    // Shift left remaining boxes
    for (let i = index + 1; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i - 1) * spacing,
        duration: 1,
      });
    }

    // Remove from array
    boxes.current.splice(index, 1);
  };

  // Swap
  const swapValues = (index1, index2) => {
    if (
      index1 < 0 ||
      index1 >= boxes.current.length ||
      index2 < 0 ||
      index2 >= boxes.current.length
    )
      return;

    const box1 = boxes.current[index1];
    const box2 = boxes.current[index2];

    const tempPos1 = box1.position.x;
    const tempPos2 = box2.position.x;

    gsap.to(box1.position, { x: tempPos2, duration: 1 });
    gsap.to(box2.position, { x: tempPos1, duration: 1 });

    // Swap in array
    [boxes.current[index1], boxes.current[index2]] = [
      boxes.current[index2],
      boxes.current[index1],
    ];
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
