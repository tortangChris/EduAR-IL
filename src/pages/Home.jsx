import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const placeholders = useRef([]);
  const sceneRef = useRef(null);
  const spacing = 2;
  const totalSlots = 6;

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    for (let i = 0; i < totalSlots; i++) {
      const placeholder = createEmptyBox();
      placeholder.position.x = i * spacing;
      scene.add(placeholder);
      placeholders.current.push(placeholder);

      const indexLabel = createTextLabel(i);
      indexLabel.position.set(i * spacing, -1.2, 0);
      scene.add(indexLabel);
    }

    let values = [1, 3, 5];
    values.forEach((val, i) => {
      const box = createBox(val);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const createBox = (value) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    const texture = createTextTexture(value);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial);
    plane.position.z = 0.51;
    mesh.add(plane);

    return mesh;
  };

  const createEmptyBox = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      opacity: 0.3,
      transparent: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  const createTextLabel = (value) => {
    const texture = createTextTexture(value, "white", "transparent", 80);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), material);
  };

  const createTextTexture = (
    text,
    color = "black",
    bg = "white",
    fontSize = 100
  ) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;
    context.fillStyle = bg;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
  };

  const appendValue = (value) => {
    const scene = sceneRef.current;
    if (boxes.current.length >= totalSlots) return;
    const box = createBox(value);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5;
    scene.add(box);
    boxes.current.push(box);
    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

  const insertValue = (index, value) => {
    const scene = sceneRef.current;
    if (boxes.current.length >= totalSlots) return;
    if (index < 0 || index > boxes.current.length) return;
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, { x: (i + 1) * spacing, duration: 1 });
    }
    const box = createBox(value);
    box.position.x = index * spacing - 5;
    scene.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 1 });
  };

  const removeValue = (index) => {
    const scene = sceneRef.current;
    if (index < 0 || index >= boxes.current.length) return;
    const removedBox = boxes.current[index];
    gsap.to(removedBox.position, {
      y: -3,
      duration: 1,
      onComplete: () => {
        scene.remove(removedBox);
      },
    });
    for (let i = index + 1; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, { x: (i - 1) * spacing, duration: 1 });
    }
    boxes.current.splice(index, 1);
  };

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
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <button
          onClick={() => {
            const val = parseInt(prompt("Enter value to append:"));
            if (!isNaN(val)) appendValue(val);
          }}
        >
          Append
        </button>
        <button
          onClick={() => {
            const index = parseInt(prompt("Enter index to insert at:"));
            const val = parseInt(prompt("Enter value to insert:"));
            if (!isNaN(index) && !isNaN(val)) insertValue(index, val);
          }}
        >
          Insert
        </button>
        <button
          onClick={() => {
            const index = parseInt(prompt("Enter index to delete:"));
            if (!isNaN(index)) removeValue(index);
          }}
        >
          Delete
        </button>
        <button
          onClick={() => {
            const i1 = parseInt(prompt("Enter first index to swap:"));
            const i2 = parseInt(prompt("Enter second index to swap:"));
            if (!isNaN(i1) && !isNaN(i2)) swapValues(i1, i2);
          }}
        >
          Swap
        </button>
      </div>

      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Home;
