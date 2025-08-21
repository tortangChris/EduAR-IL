import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

export default function Home() {
  const containerRef = useRef(null);
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const reticleRef = useRef();
  const hitTestSourceRef = useRef(null);
  const hitTestSourceRequestedRef = useRef(false);
  const placedRef = useRef(false);
  const textMeshRef = useRef();
  const boxRef = useRef();

  // drag / move states
  const isMovingRef = useRef(false);
  const longPressTimeoutRef = useRef(null);
  const movingTouchRef = useRef(false);

  useEffect(() => {
    let renderer, scene, camera;

    const init = () => {
      const container = containerRef.current;

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Scene & camera
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );
      cameraRef.current = camera;
      sceneRef.current = scene;

      // Light
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      // Reticle
      const ringGeometry = new THREE.RingGeometry(0.07, 0.095, 32).rotateX(
        -Math.PI / 2
      );
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const reticle = new THREE.Mesh(ringGeometry, ringMaterial);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      reticleRef.current = reticle;

      // Instruction text
      const textCanvas = document.createElement("canvas");
      textCanvas.width = 512;
      textCanvas.height = 128;
      const ctx = textCanvas.getContext("2d");
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
      ctx.fillStyle = "black";
      ctx.fillText("Place to ground", textCanvas.width / 2, 72);

      const textTexture = new THREE.CanvasTexture(textCanvas);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
      });
      const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.15),
        textMaterial
      );
      textPlane.position.set(0, -0.5, -1);
      textPlane.lookAt(camera.position);
      scene.add(textPlane);
      textMeshRef.current = textPlane;

      // 3D Box
      const boxGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x156289,
        metalness: 0.3,
        roughness: 0.6,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.visible = false;
      scene.add(box);
      boxRef.current = box;

      // AR Button
      document.body.appendChild(
        ARButton.createButton(renderer, {
          requiredFeatures: ["hit-test", "local-floor"],
        })
      );

      window.addEventListener("resize", onWindowResize);

      // Pointer events for drag
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointermove", onPointerMove);

      // Render loop
      renderer.setAnimationLoop(render);
    };

    const onPointerDown = () => {
      if (boxRef.current && boxRef.current.visible) {
        longPressTimeoutRef.current = setTimeout(() => {
          isMovingRef.current = true;
          movingTouchRef.current = true;
        }, 500); // long press 500ms
      }
    };

    const onPointerUp = () => {
      clearTimeout(longPressTimeoutRef.current);
      if (isMovingRef.current) {
        isMovingRef.current = false;
        movingTouchRef.current = false;
      }
    };

    const onPointerMove = () => {
      // handled in render with hit test if moving
    };

    const onWindowResize = () => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const render = (timestamp, frame) => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const reticle = reticleRef.current;

      if (frame) {
        const session = renderer.xr.getSession();
        if (session) {
          const referenceSpace = renderer.xr.getReferenceSpace();

          if (!hitTestSourceRequestedRef.current) {
            session.requestReferenceSpace("viewer").then((viewerRefSpace) => {
              session
                .requestHitTestSource({ space: viewerRefSpace })
                .then((source) => {
                  hitTestSourceRef.current = source;
                });
            });

            session.addEventListener("end", () => {
              hitTestSourceRequestedRef.current = false;
              hitTestSourceRef.current = null;
            });

            hitTestSourceRequestedRef.current = true;
          }

          const hitTestSource = hitTestSourceRef.current;
          if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);

                if (!placedRef.current) {
                  if (textMeshRef.current) textMeshRef.current.visible = false;

                  if (boxRef.current) {
                    boxRef.current.visible = true;
                    const position = new THREE.Vector3().setFromMatrixPosition(
                      reticle.matrix
                    );
                    boxRef.current.position.copy(position);
                    boxRef.current.position.y += 0.1;
                    placedRef.current = true;
                  }
                } else if (isMovingRef.current && boxRef.current) {
                  // Update box position while dragging
                  const position = new THREE.Vector3().setFromMatrixPosition(
                    reticle.matrix
                  );
                  boxRef.current.position.copy(position);
                  boxRef.current.position.y += 0.1;
                }
              }
            } else {
              reticle.visible = false;
            }
          }
        }
      }

      if (boxRef.current && boxRef.current.visible && !isMovingRef.current) {
        boxRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    init();

    return () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.setAnimationLoop(null);
        const session = renderer.xr.getSession && renderer.xr.getSession();
        if (session) session.end();
        renderer.dispose();
      }
      const container = containerRef.current;
      if (container && container.firstChild)
        container.removeChild(container.firstChild);
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return (
    <div className="w-full h-screen" ref={containerRef}>
      <div className="absolute top-4 left-4 bg-white/70 p-2 rounded">
        Open on an AR-capable device, tap "Enter AR". Long-press the box to move
        it.
      </div>
    </div>
  );
}
