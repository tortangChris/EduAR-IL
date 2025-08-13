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

    // Example animations
    setTimeout(() => {
      appendValue(scene, 8);
    }, 2000);

    setTimeout(() => {
      insertValue(scene, 2, 9);
    }, 5000);

    setTimeout(() => {
      removeValue(1);
    }, 8000);

    setTimeout(() => {
      swapValues(1, 3);
    }, 11000);

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

    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

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

  const removeValue = (index) => {
    const removedBox = boxes.current[index];

    // Animate removal (fade out + move up)
    gsap.to(removedBox.position, { y: 2, opacity: 0, duration: 0.5 });
    gsap.to(removedBox.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      onComplete: () => {
        removedBox.parent.remove(removedBox);
      },
    });

    boxes.current.splice(index, 1);

    // Shift remaining boxes left
    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, {
        x: i * spacing,
        duration: 1,
        delay: 0.3,
      });
    }
  };

  const swapValues = (index1, index2) => {
    if (
      index1 < 0 ||
      index2 < 0 ||
      index1 >= boxes.current.length ||
      index2 >= boxes.current.length
    )
      return;

    const box1 = boxes.current[index1];
    const box2 = boxes.current[index2];

    const pos1 = box1.position.x;
    const pos2 = box2.position.x;

    // Animate swap
    gsap.to(box1.position, { x: pos2, duration: 1 });
    gsap.to(box2.position, { x: pos1, duration: 1 });

    // Swap in array reference
    [boxes.current[index1], boxes.current[index2]] = [
      boxes.current[index2],
      boxes.current[index1],
    ];
  };

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
