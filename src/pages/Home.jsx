import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Home = () => {
  const mountRef = useRef(null);
  const cubesRef = useRef([]); // store cubes for shifting

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

      ctx.fillStyle = "#4fc3f7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(number, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshPhongMaterial({ map: texture });
    };

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const createCube = (value, positionIndex) => {
      const materials = [
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }),
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }),
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }),
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }),
        createNumberFace(value),
        new THREE.MeshPhongMaterial({ color: 0x4fc3f7 }),
      ];
      const cube = new THREE.Mesh(geometry, materials);
      cube.position.set(positionIndex * 1.1, 0, 0);
      scene.add(cube);

      // Border
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      line.position.copy(cube.position);
      scene.add(line);

      return { cube, line };
    };

    // Initial 8 cubes
    for (let i = 0; i < 8; i++) {
      const val = Math.floor(Math.random() * 100);
      const obj = createCube(val, i);
      cubesRef.current.push(obj);
    }

    // Animation loop
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Function to insert cube at specific index
    const insertCube = (value, index) => {
      // Shift existing cubes to the right
      const duration = 500; // ms
      const startTime = performance.now();

      const startPositions = cubesRef.current.map((obj, i) => ({
        obj,
        startX: obj.cube.position.x,
        targetX: i >= index ? obj.cube.position.x + 1.1 : obj.cube.position.x,
      }));

      const shiftAnimation = (time) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        startPositions.forEach(({ obj, startX, targetX }) => {
          const newX = startX + (targetX - startX) * t;
          obj.cube.position.x = newX;
          obj.line.position.x = newX;
        });

        if (t < 1) {
          requestAnimationFrame(shiftAnimation);
        } else {
          // After shifting, create new cube
          const newObj = createCube(value, index);
          newObj.cube.position.x = (index - 1) * 1.1 - 2; // start left for slide-in
          newObj.line.position.x = newObj.cube.position.x;

          // Insert into array
          cubesRef.current.splice(index, 0, newObj);

          // Animate slide-in
          const startX = newObj.cube.position.x;
          const targetX = index * 1.1;
          const slideStart = performance.now();

          const slideIn = (time2) => {
            const elapsed2 = time2 - slideStart;
            const t2 = Math.min(elapsed2 / duration, 1);
            const newX2 = startX + (targetX - startX) * t2;
            newObj.cube.position.x = newX2;
            newObj.line.position.x = newX2;
            if (t2 < 1) requestAnimationFrame(slideIn);
          };
          requestAnimationFrame(slideIn);
        }
      };

      requestAnimationFrame(shiftAnimation);
    };

    // Example: insert value 88 at index 2 after 2s
    setTimeout(() => {
      insertCube(88, 2);
    }, 2000);

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
