import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

// Single-file React component that places 3D text in AR using WebXR hit-test.
// Usage:
// 1. npm install three
// 2. Serve your app over HTTPS (required for WebXR). Test on a WebXR-capable device/browser
//    (e.g. Chrome for Android with WebXR enabled).
// 3. Import and use <Home /> in your React app.

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, controller;
    let reticle,
      hitTestSource = null,
      hitTestSourceRequested = false;
    let placedText = null;
    let animationFrameId;

    const init = async () => {
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;

      // Append to DOM
      mountRef.current.appendChild(renderer.domElement);

      // Scene + Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );

      // Light
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      // Reticle (shows where text will be placed)
      const ringGeometry = new THREE.RingGeometry(0.05, 0.07, 32).rotateX(
        -Math.PI / 2
      );
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x007bff });
      reticle = new THREE.Mesh(ringGeometry, ringMaterial);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      // Controller to receive "select" events (tap)
      controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect);
      scene.add(controller);

      // AR button with hit-test
      document.body.appendChild(
        ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
      );

      // Load font and prepare text geometry when needed (we'll create it on select)

      // Handle resize
      window.addEventListener("resize", onWindowResize);

      // Start rendering loop
      renderer.setAnimationLoop(render);
    };

    function onWindowResize() {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async function onSelect() {
      // When user taps while AR session is active and reticle is visible, place the text
      if (!reticle || !reticle.visible) return;

      // If a text is already placed, remove it and place a new one
      if (placedText) {
        scene.remove(placedText);
        placedText.geometry.dispose();
        if (Array.isArray(placedText.material))
          placedText.material.forEach((m) => m.dispose());
        else placedText.material.dispose();
        placedText = null;
      }

      // Load font and create text
      const loader = new FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => {
          const text = "Hello AR!";
          const geometry = new TextGeometry(text, {
            font: font,
            size: 0.08,
            height: 0.02,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.005,
            bevelSize: 0.003,
            bevelOffset: 0,
            bevelSegments: 3,
          });
          geometry.computeBoundingBox();
          geometry.center();

          const material = new THREE.MeshStandardMaterial({
            roughness: 0.4,
            metalness: 0.2,
          });
          placedText = new THREE.Mesh(geometry, material);

          // Position the text at the reticle's transform
          placedText.applyMatrix4(reticle.matrix);

          // Slightly raise the text so it doesn't z-fight with surfaces
          placedText.position.y += 0.02;

          scene.add(placedText);
        },
        undefined,
        (err) => {
          console.error("Font load error", err);
        }
      );
    }

    function render(timestamp, frame) {
      if (frame) {
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          // Request a hit test source for the "viewer" reference space
          session.requestReferenceSpace("viewer").then((referenceSpace) => {
            session
              .requestHitTestSource({ space: referenceSpace })
              .then((source) => {
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
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            // Update reticle to show placement
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    init();

    // Cleanup on unmount
    return () => {
      try {
        window.removeEventListener("resize", onWindowResize);
        if (renderer) {
          renderer.setAnimationLoop(null);
          renderer.dispose();
          if (renderer.domElement && mountRef.current)
            mountRef.current.removeChild(renderer.domElement);
        }
      } catch (e) {
        console.warn("Cleanup error", e);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  );
};

export default Home;
