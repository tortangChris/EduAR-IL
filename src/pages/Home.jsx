import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

export default function Home() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cubeRef = useRef(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [inARSession, setInARSession] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, controls, raycaster;
    let reticle;
    let hitTestSource = null;
    let localReferenceSpace = null;

    const container = containerRef.current;
    if (!container) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera (non-AR)
    camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.01,
      100
    );
    camera.position.set(0, 1.6, 2);
    cameraRef.current = camera;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    hemi.position.set(0.5, 1, 0.25);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(0, 4, 2);
    scene.add(dir);

    // Grid for desktop view
    const grid = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
    grid.position.y = 0;
    scene.add(grid);

    // Cube
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.15, -0.5);
    cube.userData.draggable = true;
    scene.add(cube);
    cubeRef.current = cube;

    // Reticle
    const ringGeo = new THREE.RingGeometry(0.09, 0.11, 32).rotateX(
      -Math.PI / 2
    );
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.visible = false;
    scene.add(reticle);

    // Raycaster
    raycaster = new THREE.Raycaster();

    // OrbitControls for desktop
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.15, 0);
    controls.update();

    // Resize handler
    const onWindowResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onWindowResize);

    // Pointer dragging for desktop
    let dragging = false;
    let dragOffset = new THREE.Vector3();
    let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const getIntersectionsWithPlane = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const pos = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, pos);
      return pos;
    };

    const onPointerDown = (event) => {
      event.preventDefault();
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(cube, true);
      if (intersects.length > 0) {
        dragging = true;
        const intersectPoint = intersects[0].point;
        dragOffset.copy(intersectPoint).sub(cube.position);
        controls.enabled = false;
      }
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      const pos = getIntersectionsWithPlane(event);
      if (pos) {
        cube.position.set(pos.x - dragOffset.x, 0.15, pos.z - dragOffset.z);
      }
    };

    const onPointerUp = () => {
      dragging = false;
      controls.enabled = true;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // === Touch gesture controls for AR ===
    let isTouching = false;
    let initialDistance = 0;
    let initialScale = 1;
    let lastAngle = 0;

    const getDistance = (t1, t2) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getAngle = (t1, t2) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.atan2(dy, dx);
    };

    const onTouchStart = (e) => {
      if (!renderer.xr.isPresenting) return;
      if (e.touches.length === 2) {
        isTouching = true;
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        lastAngle = getAngle(e.touches[0], e.touches[1]);
        initialScale = cube.scale.x;
      }
    };

    const onTouchMove = (e) => {
      if (!renderer.xr.isPresenting) return;

      if (e.touches.length === 1) {
        if (reticle && reticle.visible) {
          cube.position.copy(reticle.position);
          cube.position.y += 0.15;
        }
      }

      if (e.touches.length === 2 && isTouching) {
        const newDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleFactor = newDistance / initialDistance;
        cube.scale.setScalar(
          Math.min(Math.max(initialScale * scaleFactor, 0.2), 3)
        );

        const newAngle = getAngle(e.touches[0], e.touches[1]);
        const angleDiff = newAngle - lastAngle;
        cube.rotation.y += angleDiff;
        lastAngle = newAngle;
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        isTouching = false;
      }
    };

    renderer.domElement.addEventListener("touchstart", onTouchStart, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchmove", onTouchMove, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchend", onTouchEnd, {
      passive: false,
    });

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      renderer.setAnimationLoop(() => {
        if (renderer.xr.isPresenting && hitTestSource && localReferenceSpace) {
          const frame = renderer.xr.getFrame();
          const session = renderer.xr.getSession();
          if (frame) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(localReferenceSpace);
              reticle.visible = true;
              reticle.position.set(
                pose.transform.position.x,
                pose.transform.position.y,
                pose.transform.position.z
              );
              reticle.quaternion.set(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z,
                pose.transform.orientation.w
              );
            } else {
              reticle.visible = false;
            }
          }
        }

        if (!renderer.xr.isPresenting) {
          const t = clock.getElapsedTime();
          cube.rotation.y = t * 0.2;
        }

        renderer.render(scene, camera);
      });
    };
    animate();

    // AR Button setup
    const addARButton = async () => {
      if (navigator.xr) {
        const isSupported = await navigator.xr
          .isSessionSupported("immersive-ar")
          .catch(() => false);
        setIsARSupported(isSupported);
        if (isSupported) {
          const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
          });

          arButton.style.position = "absolute";
          arButton.style.bottom = "20px";
          arButton.style.left = "20px";
          container.appendChild(arButton);

          renderer.xr.addEventListener("sessionstart", async () => {
            setInARSession(true);
            const session = renderer.xr.getSession();
            localReferenceSpace = await session.requestReferenceSpace("local");
            try {
              const viewerSpace = await session.requestReferenceSpace("viewer");
              hitTestSource = await session.requestHitTestSource({
                space: viewerSpace,
              });
            } catch (e) {
              console.warn("Hit test not available", e);
            }
          });

          renderer.xr.addEventListener("sessionend", () => {
            setInARSession(false);
            hitTestSource = null;
            localReferenceSpace = null;
            reticle.visible = false;
          });
        }
      }
    };
    addARButton();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const zoomCamera = (delta) => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.z = Math.min(Math.max(camera.position.z + delta, 0.3), 10);
  };

  const scaleCube = (factor) => {
    const cube = cubeRef.current;
    if (!cube) return;
    cube.scale.multiplyScalar(factor);
    cube.scale.clampScalar(0.2, 3);
  };

  const placeOnReticle = () => {
    const cube = cubeRef.current;
    const renderer = rendererRef.current;
    if (!cube || !renderer) return;
    const reticle = sceneRef.current.children.find(
      (c) => c.geometry && c.geometry.type === "RingGeometry"
    );
    if (reticle && reticle.visible) {
      cube.position.copy(reticle.position);
      cube.quaternion.copy(reticle.quaternion);
      cube.position.y += 0.15;
    }
  };

  return (
    <div
      className="w-full h-full min-h-screen bg-gray-900 text-white relative"
      style={{ height: "100vh" }}
    >
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-black/60 p-2 rounded">
          <button
            className="px-3 py-1 border rounded mr-2"
            onClick={() => zoomCamera(-0.2)}
          >
            Zoom In
          </button>
          <button
            className="px-3 py-1 border rounded mr-2"
            onClick={() => zoomCamera(0.2)}
          >
            Zoom Out
          </button>
        </div>
        <div className="bg-black/60 p-2 rounded">
          <button
            className="px-3 py-1 border rounded mr-2"
            onClick={() => scaleCube(1.1)}
          >
            Scale +
          </button>
          <button
            className="px-3 py-1 border rounded mr-2"
            onClick={() => scaleCube(0.9)}
          >
            Scale -
          </button>
          <button className="px-3 py-1 border rounded" onClick={placeOnReticle}>
            Place on surface
          </button>
        </div>
      </div>

      {!inARSession && isARSupported && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-yellow-400/90 text-black px-4 py-2 rounded-lg shadow-lg">
          <strong>AR Ready:</strong> Point your device to a clear flat surface
          (ground or table) and tap "Enter AR".
        </div>
      )}

      {!isARSupported && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          <strong>WebXR not supported:</strong> Your device or browser doesn't
          support immersive AR.
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 bg-black/40 px-3 py-1 rounded">
        Tip: Drag the cube to move it. In AR, use one finger to place, pinch to
        scale, and twist to rotate.
      </div>
    </div>
  );
}
