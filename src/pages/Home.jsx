import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

const Home = () => {
  const mountRef = useRef(null);

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

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x4fc3f7 });

    // Load font first for text labels
    const fontLoader = new FontLoader();
    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        for (let i = 0; i < 8; i++) {
          // Box
          const box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.set(i * 1.1, 0, 0);
          scene.add(box);

          // Box border
          const edges = new THREE.EdgesGeometry(boxGeometry);
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
          );
          line.position.copy(box.position);
          scene.add(line);

          // Text label
          const textGeo = new TextGeometry(i.toString(), {
            font: font,
            size: 0.4,
            height: 0.05,
          });
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
          const textMesh = new THREE.Mesh(textGeo, textMaterial);
          textGeo.computeBoundingBox();
          const textWidth =
            textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

          // Center text over the box
          textMesh.position.set(
            box.position.x - textWidth / 2,
            box.position.y + 0.8,
            box.position.z
          );
          scene.add(textMesh);
        }
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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
