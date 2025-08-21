// Home.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

const Home = () => {
  const containerRef = useRef();

  useEffect(() => {
    let renderer, scene, camera, controller;
    let reticle = null;
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let boxMesh = null;
    let xrSession = null;

    const init = () => {
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local");
      containerRef.current.appendChild(renderer.domElement);

      // Scene + Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );

      // Lighting
      const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.6);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(0.5, 1, 0.25);
      scene.add(dir);

      // Reticle (visual guide where object will be placed)
      const ringGeom = new THREE.RingGeometry(0.06, 0.08, 32).rotateX(
        -Math.PI / 2
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        opacity: 0.85,
        transparent: true,
      });
      reticle = new THREE.Mesh(ringGeom, ringMat);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      // Box (initially not added to scene)
      const boxGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xff5533,
        metalness: 0.3,
        roughness: 0.6,
      });
      boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.visible = false;
      scene.add(boxMesh);

      // ARButton to start AR session
      const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
      });
      // append AR button to container (or document body)
      containerRef.current.appendChild(arButton);

      // Controller (listening for 'select' events)
      controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect); // when user taps screen in AR
      scene.add(controller);

      // Handle window resize
      window.addEventListener("resize", onWindowResize);

      // animate loop
      renderer.setAnimationLoop(render);
    };

    function onWindowResize() {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }

    // When user taps/selects: place or move the box to reticle pose
    function onSelect() {
      if (!reticle || !reticle.visible) return;

      // Use the reticle's matrix to set box position + rotation
      const matrix = reticle.matrix;
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      matrix.decompose(position, quaternion, scale);

      boxMesh.position.copy(position);
      boxMesh.quaternion.copy(quaternion);
      boxMesh.visible = true;
    }

    function render(timestamp, frame) {
      if (frame) {
        const session = renderer.xr.getSession();

        // Request hit test source once per session
        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((referenceSpace) => {
            session
              .requestHitTestSource({ space: referenceSpace })
              .then((source) => {
                hitTestSource = source;
              });
          });

          // Optional: cleanup when session ends
          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
            reticle.visible = false;
            xrSession = null;
          });

          hitTestSourceRequested = true;
          xrSession = session;
        }

        if (hitTestSource) {
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            // update reticle matrix
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            // no hit -> hide reticle
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    // initialize
    init();

    // cleanup on unmount
    return () => {
      try {
        if (renderer) {
          renderer.setAnimationLoop(null);
          window.removeEventListener("resize", onWindowResize);
          if (
            containerRef.current &&
            renderer.domElement.parentElement === containerRef.current
          ) {
            containerRef.current.removeChild(renderer.domElement);
          }
        }
        // end XR session if running
        const sess = renderer?.xr?.getSession && renderer.xr.getSession();
        if (sess) {
          sess.end();
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        touchAction: "none", // important for mobile/touch to let WebXR capture gestures
      }}
    />
  );
};

export default Home;
