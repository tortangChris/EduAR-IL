import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const placeholders = useRef([]);
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

    // Controls
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
      const box = createBox(val, i);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    // Add empty placeholders (3 slots to the right)
    const extraSlots = 3;
    for (let i = 0; i < extraSlots; i++) {
      const placeholder = createBox("", values.length + i, true);
      placeholder.position.x = (values.length + i) * spacing;
      scene.add(placeholder);
      placeholders.current.push(placeholder);
    }

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

  // Create box with value + index in front
  const createBox = (value, index, isPlaceholder = false) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: isPlaceholder ? 0xaaaaaa : 0x00aaff,
      opacity: isPlaceholder ? 0.3 : 1,
      transparent: isPlaceholder,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Create canvas for value + index
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;

    // Background white
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Value (center)
    context.fillStyle = "black";
    context.font = "bold 100px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(value, canvas.width / 2, canvas.height / 2 - 20);

    // Index (small at bottom)
    context.font = "bold 40px Arial";
    context.fillText(`[${index}]`, canvas.width / 2, canvas.height / 2 + 70);

    // Apply texture
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial);
    plane.position.z = 0.51; // front face
    mesh.add(plane);

    return mesh;
  };

  const updateIndexes = () => {
    [...boxes.current, ...placeholders.current].forEach((box, idx) => {
      box.children.forEach((child) => {
        if (child.material && child.material.map) {
          const value = idx < boxes.current.length ? getValueFromBox(box) : ""; // placeholders have no value

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = 256;
          canvas.height = 256;

          context.fillStyle = "white";
          context.fillRect(0, 0, canvas.width, canvas.height);

          context.fillStyle = "black";
          context.font = "bold 100px Arial";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(value, canvas.width / 2, canvas.height / 2 - 20);

          context.font = "bold 40px Arial";
          context.fillText(
            `[${idx}]`,
            canvas.width / 2,
            canvas.height / 2 + 70
          );

          child.material.map = new THREE.CanvasTexture(canvas);
          child.material.needsUpdate = true;
        }
      });
    });
  };

  const getValueFromBox = (box) => {
    // Extract number from texture
    // Since we stored it in canvas text earlier, we just keep track of it
    // but here we'll just return "" (placeholder for now)
    return ""; // You can store value in box.userData.value if needed
  };

  // Append
  const appendValue = (scene, value) => {
    const newIndex = boxes.current.length;
    const box = createBox(value, newIndex);
    box.position.x = newIndex * spacing + 5;
    scene.add(box);
    boxes.current.push(box);
    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
    updateIndexes();
  };

  // Insert
  const insertValue = (scene, index, value) => {
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i + 1) * spacing,
        duration: 1,
      });
    }
    const box = createBox(value, index);
    box.position.x = index * spacing - 5;
    scene.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 1 });
    updateIndexes();
  };

  // Remove
  const removeValue = (scene, index) => {
    if (index < 0 || index >= boxes.current.length) return;

    const removedBox = boxes.current[index];
    gsap.to(removedBox.position, {
      y: -3,
      opacity: 0,
      duration: 1,
      onComplete: () => {
        scene.remove(removedBox);
      },
    });

    for (let i = index + 1; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i - 1) * spacing,
        duration: 1,
      });
    }
    boxes.current.splice(index, 1);
    updateIndexes();
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

    [boxes.current[index1], boxes.current[index2]] = [
      boxes.current[index2],
      boxes.current[index1],
    ];
    updateIndexes();
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
