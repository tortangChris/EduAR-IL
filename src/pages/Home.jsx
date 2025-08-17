import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

const Home = () => {
  const mountRef = useRef(null);
  const [array, setArray] = useState([5, 8, 3, 6, 2, 9, 7, 4, 1, 10]);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    camera.position.set(0, 1.6, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Add lights
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Reticle for AR placement
    const reticleGeometry = new THREE.RingGeometry(0.1, 0.12, 32).rotateX(
      -Math.PI / 2
    );
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.visible = false;
    scene.add(reticle);

    // Bars group
    const barsGroup = new THREE.Group();
    array.forEach((value, i) => {
      const geometry = new THREE.BoxGeometry(0.2, value * 0.2, 0.2);
      const material = new THREE.MeshStandardMaterial({ color: 0x008080 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(i * 0.25 - 1, (value * 0.2) / 2, 0);
      barsGroup.add(box);
    });
    scene.add(barsGroup);

    // AR Button
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    }
    animate();

    // Resize
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [array]);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
