import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Array values
    const arrayValues = [10, 20, 30, 40, 50];

    // Font loader for numbers
    const loader = new THREE.FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const geometryBox = new THREE.BoxGeometry(1, 1, 1);
        const materialBox = new THREE.MeshPhongMaterial({ color: 0x4cafef });

        arrayValues.forEach((value, index) => {
          // Box mesh
          const cube = new THREE.Mesh(geometryBox, materialBox.clone());
          cube.position.set(index * 2, 0, 0);
          scene.add(cube);

          // Text mesh (number)
          const textGeo = new THREE.TextGeometry(String(value), {
            font: font,
            size: 0.4,
            height: 0.05,
          });
          const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const textMesh = new THREE.Mesh(textGeo, textMat);
          textGeo.computeBoundingBox();
          const textWidth =
            textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
          textMesh.position.set(
            cube.position.x - textWidth / 2,
            cube.position.y - 0.2,
            cube.position.z + 0.51
          );
          scene.add(textMesh);
        });
      }
    );

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
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

    // Cleanup
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
