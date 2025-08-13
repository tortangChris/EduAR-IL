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

    // Initial values
    let values = [1, 3, 5];
    values.forEach((val, i) => {
      const box = createBoxWithIndex(val, i);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    // Empty placeholders
    const extraSlots = 3;
    for (let i = 0; i < extraSlots; i++) {
      const placeholder = createEmptyBoxWithIndex(values.length + i);
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

  // Create cube with value on front & index at bottom
  const createBoxWithIndex = (value, index) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    // Value label (front)
    const valuePlane = createTextPlane(value, "100px Arial", "black", "white");
    valuePlane.position.z = 0.51;
    mesh.add(valuePlane);

    // Index label (bottom)
    const indexPlane = createTextPlane(index, "50px Arial", "black", "white");
    indexPlane.position.set(0, -0.7, 0);
    mesh.add(indexPlane);

    return mesh;
  };

  // Create empty placeholder with index label
  const createEmptyBoxWithIndex = (index) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      opacity: 0.3,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const indexPlane = createTextPlane(index, "50px Arial", "black", "white");
    indexPlane.position.set(0, -0.7, 0);
    mesh.add(indexPlane);

    return mesh;
  };

  // Create text plane (for both value & index)
  const createTextPlane = (text, font, textColor, bgColor) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = textColor;
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  };

  // Append
  const appendValue = (scene, value) => {
    const box = createBoxWithIndex(value, boxes.current.length);
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
    const box = createBoxWithIndex(value, index);
    box.position.x = index * spacing - 5;
    scene.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 1 });

    updateIndices();
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
    updateIndices();
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

    updateIndices();
  };

  // Update index labels after any change
  const updateIndices = () => {
    boxes.current.forEach((box, i) => {
      const indexLabel = createTextPlane(i, "50px Arial", "black", "white");
      indexLabel.position.set(0, -0.7, 0);

      // Remove old index label & replace
      const oldLabel = box.children.find(
        (child) =>
          child.geometry.type === "PlaneGeometry" && child.position.y < 0
      );
      if (oldLabel) box.remove(oldLabel);

      box.add(indexLabel);
    });
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
