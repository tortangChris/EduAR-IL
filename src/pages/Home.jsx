import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const spacing = 2; // pagitan ng boxes sa X-axis

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 5, 5);
    scene.add(light);

    // Initial array values
    let values = [1, 3, 5];
    values.forEach((val, i) => {
      const box = createBox(val);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    camera.position.z = 10;

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Example: Append and Insert after delay
    setTimeout(() => {
      appendValue(scene, 8); // Append
    }, 2000);

    setTimeout(() => {
      insertValue(scene, 2, 9); // Insert at index 2
    }, 5000);

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

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

  const appendValue = (scene, value) => {
    const box = createBox(value);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5; // Start from outside
    scene.add(box);
    boxes.current.push(box);

    // Animate to correct position
    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

  const insertValue = (scene, index, value) => {
    // Move existing boxes to the right
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i + 1) * spacing,
        duration: 1,
      });
    }

    // Create new box
    const box = createBox(value);
    box.position.x = index * spacing - 5; // Start from left outside
    scene.add(box);

    // Insert into array
    boxes.current.splice(index, 0, box);

    // Animate new box into place
    gsap.to(box.position, { x: index * spacing, duration: 1 });
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
