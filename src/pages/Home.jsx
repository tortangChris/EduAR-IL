import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const Home = () => {
  const containerRef = useRef(null);
  const [arStarted, setArStarted] = useState(false);

  useEffect(() => {
    if (!arStarted) return; // Do nothing until AR is started

    let scene, camera, renderer;
    let reticle;
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let objectPlaced = false;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20,
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    containerRef.current.appendChild(renderer.domElement);

    // Light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Reticle
    const ringGeo = new THREE.RingGeometry(0.07, 0.09, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.rotation.x = -Math.PI / 2;
    reticle.visible = false;
    scene.add(reticle);

    // Sample 3D box
    const boxGeo = new THREE.BoxGeometry(0.15, 0.1, 0.05);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
    const box = new THREE.Mesh(boxGeo, boxMat);

    // Animation loop
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((space) => {
            session.requestHitTestSource({ space }).then((source) => {
              hitTestSource = source;
            });
          });

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });

          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            reticle.visible = true;
            reticle.position.set(
              pose.transform.position.x,
              pose.transform.position.y,
              pose.transform.position.z,
            );
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    });

    // Tap to place object
    renderer.domElement.addEventListener("click", () => {
      if (reticle.visible && !objectPlaced) {
        box.position.copy(reticle.position);
        scene.add(box);
        objectPlaced = true;
      }
    });

    // Start AR button
    const button = THREE.WEBXR.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    document.body.appendChild(button);

    return () => {
      renderer.setAnimationLoop(null);
      if (containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      document.body.removeChild(button);
    };
  }, [arStarted]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {!arStarted && (
        <button
          onClick={() => setArStarted(true)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2196f3",
            color: "#fff",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          Start AR
        </button>
      )}
    </div>
  );
};

export default Home;
