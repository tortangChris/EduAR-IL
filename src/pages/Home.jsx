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
    let dragging = false;

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
      const hem = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(hem);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(0.5, 1, 0.5);
      scene.add(dir);

      // Ground grid (3D fallback only)
      const grid = new THREE.GridHelper(4, 20, 0x444444, 0x222222);
      grid.rotation.x = Math.PI / 2;
      grid.position.y = -0.02;
      scene.add(grid);

      // Array group
      arrayGroup = new THREE.Group();
      scene.add(arrayGroup);
      arrayGroup.position.set(0, 0.15, -0.6);
      renderArray();

      // Orbit controls (desktop 3D mode)
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.15, -0.6);
      controls.update();

      // Reticle for AR floor tracking
      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00ffaa })
      );
      reticle.visible = false;
      scene.add(reticle);

      // Events
      window.addEventListener("resize", onWindowResize);
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", () => {
        dragging = false;
      });

      // AR button
      const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test", "local-floor"], // floor tracking
      });
      document.body.appendChild(arButton);

      // Hook AR session
      const originalSetSession = renderer.xr.setSession.bind(renderer.xr);
      renderer.xr.setSession = async (session) => {
        if (session) {
          controls.enabled = false;
          arrayPlaced = false;

          const refSpace = await session.requestReferenceSpace("viewer");
          const hitTestSource = await session.requestHitTestSource({
            space: refSpace,
          });
          renderer.xr.hitTestSource = hitTestSource;

          session.addEventListener("end", () => {
            renderer.xr.hitTestSource = null;
            reticle.visible = false;
          });

          session.addEventListener("select", () => {
            if (!arrayPlaced && reticle.visible) {
              arrayGroup.position.copy(reticle.position);
              arrayGroup.quaternion.copy(reticle.quaternion);
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

      // Label
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
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
          // Highlight (glow)
          if (selectedMesh && selectedMesh.material.emissive)
            selectedMesh.material.emissive.setHex(0x000000);
          selectedMesh = obj;
          if (selectedMesh.material?.emissive)
            selectedMesh.material.emissive.setHex(0x22ff22);

          // Example: Assessment – if index=1 → trigger
          if (idx === 1) {
            console.log("Assessment: tapped index 1, glowing!");
          }

          // Allow dragging
          dragging = true;
        }
      }
    }

    function onPointerMove(event) {
      if (!dragging || !selectedMesh) return;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects([reticle], true);
      if (intersects.length) {
        const point = intersects[0].point;
        selectedMesh.position.copy(point);
        selectedMesh.position.y = boxSize / 2; // keep on ground
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function updateReticle(frame) {
      const session = renderer.xr.getSession();
      if (!session) return;
      const hitTestSource = renderer.xr.hitTestSource;
      if (!hitTestSource) return;

      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
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
