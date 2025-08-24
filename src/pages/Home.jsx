// Home.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    let camera, scene, renderer, controls;
    let arrayGroup;
    let arr = [10, 20, 30, 40];
    const boxSize = 0.12;
    const spacing = 0.02;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectedMesh = null;
    let reticle = null;
    let arrayPlaced = false;

    let dragActive = false;
    let pinchStartDistance = 0;

    init();
    animate();

    function init() {
      const container = containerRef.current;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );
      camera.position.set(0, 0.6, 1.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      container.appendChild(renderer.domElement);

      // Lights
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(0.5, 1, 0.5);
      scene.add(dir);

      // Ground grid (3D mode only)
      const grid = new THREE.GridHelper(4, 20, 0x444444, 0x222222);
      grid.rotation.x = Math.PI / 2;
      grid.position.y = -0.02;
      scene.add(grid);

      // Array group
      arrayGroup = new THREE.Group();
      scene.add(arrayGroup);
      arrayGroup.position.set(0, 0.15, -0.6);
      renderArray();

      // Orbit controls (desktop)
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.15, -0.6);
      controls.update();

      // Reticle for AR placement
      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x0fffaa })
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      // Events
      window.addEventListener("resize", onWindowResize);
      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      // Touch gestures (for AR)
      renderer.domElement.addEventListener("touchstart", onTouchStart, true);
      renderer.domElement.addEventListener("touchmove", onTouchMove, true);
      renderer.domElement.addEventListener("touchend", onTouchEnd, true);

      // AR button
      const arButton = ARButton.createButton(renderer, {
        optionalFeatures: ["local-floor", "bounded-floor", "hit-test"],
      });
      document.body.appendChild(arButton);

      // AR session hook
      const originalSetSession = renderer.xr.setSession.bind(renderer.xr);
      renderer.xr.setSession = async (session) => {
        if (session) {
          controls.enabled = false;
          arrayPlaced = false;

          const viewerSpace = await session.requestReferenceSpace("viewer");
          const hitTestSource = await session.requestHitTestSource({
            space: viewerSpace,
          });
          renderer.xr.hitTestSource = hitTestSource;

          session.addEventListener("end", () => {
            renderer.xr.hitTestSource = null;
            reticle.visible = false;
          });

          session.addEventListener("select", () => {
            if (!arrayPlaced && reticle.visible) {
              arrayGroup.position.setFromMatrixPosition(reticle.matrix);
              arrayGroup.quaternion.setFromRotationMatrix(reticle.matrix);
              arrayPlaced = true;
            }
          });
        } else {
          controls.enabled = true;
        }
        return originalSetSession(session);
      };
    }

    function renderArray() {
      while (arrayGroup.children.length)
        arrayGroup.remove(arrayGroup.children[0]);

      const total = arr.length;
      const width = total * (boxSize + spacing) - spacing;
      const startX = -width / 2 + boxSize / 2;

      for (let i = 0; i < total; i++) {
        const x = startX + i * (boxSize + spacing);
        const mesh = createBoxWithLabel(String(arr[i]), i);
        mesh.position.set(x, 0, 0);
        mesh.userData.index = i;
        arrayGroup.add(mesh);
      }
    }

    function createBoxWithLabel(text, index) {
      const geo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      const mat = new THREE.MeshStandardMaterial({ color: 0x66a3ff });
      const mesh = new THREE.Mesh(geo, mat);

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 16);

      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture });
      const labelGeo = new THREE.PlaneGeometry(0.18, 0.09);
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.set(0, 0, boxSize / 2 + 0.001);
      mesh.add(labelMesh);

      mesh.userData.index = index;
      return mesh;
    }

    // ---- Interaction ----
    function onPointerDown(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(arrayGroup.children, true);
      if (intersects.length) {
        let obj = intersects[0].object;
        while (obj && obj.parent && obj.userData.index === undefined) {
          obj = obj.parent;
        }
        const idx = obj.userData.index;
        if (typeof idx === "number") {
          if (selectedMesh && selectedMesh.material.emissive)
            selectedMesh.material.emissive.setHex(0x000000);
          selectedMesh = obj;
          if (selectedMesh.material?.emissive)
            selectedMesh.material.emissive.setHex(0x005500);
        }
      }
    }

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        dragActive = true;
      } else if (e.touches.length === 2) {
        pinchStartDistance = getPinchDistance(e);
      }
    }

    function onTouchMove(e) {
      if (dragActive && e.touches.length === 1 && arrayPlaced) {
        // drag horizontally
        const dx = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        arrayGroup.position.x = dx;
      }
      if (e.touches.length === 2) {
        const newDist = getPinchDistance(e);
        if (pinchStartDistance > 0) {
          const scale = newDist / pinchStartDistance;
          arrayGroup.scale.set(scale, scale, scale);
        }
      }
    }

    function onTouchEnd(e) {
      dragActive = false;
      pinchStartDistance = 0;
    }

    function getPinchDistance(e) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // ---- Window resize ----
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ---- Reticle update ----
    function updateReticle(frame) {
      const refSpace = renderer.xr.getReferenceSpace();
      const hitTestSource = renderer.xr.hitTestSource;
      if (!hitTestSource) return;
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(refSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }

    // ---- Animation loop ----
    function animate() {
      renderer.setAnimationLoop((_, frame) => {
        if (renderer.xr.isPresenting && frame) {
          updateReticle(frame);
        }
        renderer.render(scene, camera);
      });
    }

    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
