import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const spacing = 2; // pagitan ng boxes
  const [sceneObj, setSceneObj] = useState(null);

  // Input states
  const [valueInput, setValueInput] = useState("");
  const [indexInput, setIndexInput] = useState("");

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

    setSceneObj(scene);

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

  const appendValue = () => {
    if (!valueInput || !sceneObj) return;
    const box = createBox(valueInput);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5;
    sceneObj.add(box);
    boxes.current.push(box);

    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
    setValueInput("");
  };

  const insertValue = () => {
    if (!valueInput || indexInput === "" || !sceneObj) return;
    const index = parseInt(indexInput);
    if (index < 0 || index > boxes.current.length) return;

    // Move existing boxes to the right
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: (i + 1) * spacing,
        duration: 1,
      });
    }

    const box = createBox(valueInput);
    box.position.x = index * spacing - 5;
    sceneObj.add(box);

    boxes.current.splice(index, 0, box);

    gsap.to(box.position, { x: index * spacing, duration: 1 });

    setValueInput("");
    setIndexInput("");
  };

  const removeValue = () => {
    if (indexInput === "" || !sceneObj) return;
    const index = parseInt(indexInput);
    if (index < 0 || index >= boxes.current.length) return;

    const removed = boxes.current[index];
    gsap.to(removed.position, {
      x: removed.position.x + 5,
      duration: 1,
      onComplete: () => {
        sceneObj.remove(removed);
      },
    });

    boxes.current.splice(index, 1);

    // Move remaining boxes to the left
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: i * spacing,
        duration: 1,
      });
    }

    setIndexInput("");
  };

  return (
    <div style={{ display: "flex" }}>
      {/* 3D Scene */}
      <div ref={mountRef} style={{ width: "80%", height: "100vh" }} />

      {/* Controls */}
      <div
        style={{
          padding: "10px",
          background: "#222",
          color: "#fff",
          width: "20%",
        }}
      >
        <h2>Array Controls</h2>
        <input
          type="text"
          placeholder="Value"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          style={{ width: "100%", marginBottom: "5px" }}
        />
        <input
          type="number"
          placeholder="Index"
          value={indexInput}
          onChange={(e) => setIndexInput(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />
        <button
          onClick={appendValue}
          style={{ width: "100%", marginBottom: "5px" }}
        >
          Append
        </button>
        <button
          onClick={insertValue}
          style={{ width: "100%", marginBottom: "5px" }}
        >
          Insert
        </button>
        <button onClick={removeValue} style={{ width: "100%" }}>
          Remove
        </button>
      </div>
    </div>
  );
};

export default Home;
