// Home.js
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]); // moving value boxes
  const slotMeshes = useRef([]); // visual slot boxes (static)
  const indexLabels = useRef([]); // static index labels
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  const spacing = 2;
  const totalSlots = 8; // total visible slots (including placeholders)
  const operationDuration = 1200; // ms per move animation (tweakable)

  useEffect(() => {
    // --- Setup scene, camera, renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x20232a);
    sceneRef.current = scene;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(((totalSlots - 1) * spacing) / 2, 6, 14);
    camera.lookAt(((totalSlots - 1) * spacing) / 2, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    // Lights
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(0, 20, 10);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Add static slots and index labels
    for (let i = 0; i < totalSlots; i++) {
      const slot = createSlotMesh();
      slot.position.set(i * spacing, 0, 0);
      scene.add(slot);
      slotMeshes.current.push(slot);

      const idxLabel = createLabelMesh(i.toString(), {
        fontSize: 80,
        color: "white",
        bgTransparent: true,
      });
      idxLabel.position.set(i * spacing, -1.3, 0);
      // make sure label faces camera always by using lookAt in render loop if needed
      scene.add(idxLabel);
      indexLabels.current.push(idxLabel);
    }

    // Operation title mesh (top)
    const opTitle = createLabelMesh("", {
      fontSize: 120,
      color: "#ffee88",
      bgTransparent: true,
    });
    opTitle.position.set(((totalSlots - 1) * spacing) / 2, 3.2, 0);
    opTitle.scale.set(1.6, 1.2, 1);
    opTitle.name = "opTitle";
    scene.add(opTitle);

    // Initial values (put into first few slots)
    const initialValues = [5, 3, 8]; // example
    initialValues.forEach((v, i) => {
      const b = createValueBox(v);
      b.position.set(i * spacing, 0, 0);
      scene.add(b);
      boxes.current.push(b);
    });

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      // ensure index labels and opTitle face camera (billboarding)
      indexLabels.current.forEach((label) => label.lookAt(camera.position));
      const titleMesh = scene.getObjectByName("opTitle");
      if (titleMesh) titleMesh.lookAt(camera.position);
      renderer.render(scene, camera);
    };
    animate();

    // Responsive
    const onResize = () => {
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Run the sequence of operations (append -> insert -> remove -> swap)
    runSequence();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      controls.dispose();
      mountRef.current.removeChild(renderer.domElement);
      // dispose geometries/materials if needed (omitted for brevity)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Helper creators
  // -------------------------
  const createSlotMesh = () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  };

  const createValueBox = (value) => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 0.1,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // value text plane (front)
    const tex = createTextTexture(value.toString(), {
      fontSize: 140,
      color: "black",
      bgTransparent: true,
    });
    const matText = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matText);
    plane.position.set(0, 0, 0.51);
    mesh.add(plane);

    // small top highlight
    return mesh;
  };

  // Creates a flat label as a plane with 2D text.
  // options: { fontSize, color, bgTransparent }
  const createLabelMesh = (text, options = {}) => {
    const { fontSize = 100, color = "black", bgTransparent = false } = options;
    const tex = createTextTexture(text, { fontSize, color, bgTransparent });
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    // Width 1 unit roughly equals slot width. Height smaller for index.
    const height = fontSize > 100 ? 0.8 : 0.45;
    return new THREE.Mesh(new THREE.PlaneGeometry(1.1, height), mat);
  };

  const createTextTexture = (text, opts = {}) => {
    const { fontSize = 100, color = "black", bgTransparent = false } = opts;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!bgTransparent) {
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0, 0, size, size);
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // use relative fontsize
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(text, size / 2, size / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // -------------------------
  // Utility: wait
  // -------------------------
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // -------------------------
  // Operation helpers
  // -------------------------
  // update top operation title text
  const setOperationTitle = (text) => {
    const scene = sceneRef.current;
    const mesh = scene.getObjectByName("opTitle");
    if (!mesh) return;
    // update map texture
    const tex = createTextTexture(text, {
      fontSize: 120,
      color: "#ffee88",
      bgTransparent: true,
    });
    mesh.material.map = tex;
    mesh.material.needsUpdate = true;
  };

  // find first free slot index after current boxes
  const firstFreeSlot = () => boxes.current.length;

  // Move a box to slotIndex (x = slotIndex * spacing)
  const moveBoxToSlot = (box, slotIndex, durationMs = operationDuration) => {
    const targetX = slotIndex * spacing;
    return gsap
      .to(box.position, {
        x: targetX,
        duration: durationMs / 1000,
        ease: "power2.out",
      })
      .then();
  };

  // Append operation
  const doAppend = async (value) => {
    setOperationTitle(`Append - Adds a new element at the end of the array`);
    // if no space, skip
    if (boxes.current.length >= totalSlots) {
      setOperationTitle("No space to Append");
      await wait(800);
      return;
    }
    // create from right (outside) and animate in
    const scene = sceneRef.current;
    const box = createValueBox(value);
    const startX = boxes.current.length * spacing + 6;
    box.position.set(startX, 0, 0);
    scene.add(box);
    boxes.current.push(box);
    await moveBoxToSlot(box, boxes.current.length - 1);
    await wait(300);
  };

  // Insert operation
  const doInsert = async (index, value) => {
    setOperationTitle(`Insert - Adds a new element at index ${index}`);
    if (index < 0 || index > boxes.current.length) {
      setOperationTitle("Invalid insert index");
      await wait(800);
      return;
    }
    if (boxes.current.length >= totalSlots) {
      setOperationTitle("No space to Insert");
      await wait(800);
      return;
    }
    const scene = sceneRef.current;
    // shift boxes from index..end to the right by 1 slot
    const promises = [];
    for (let i = boxes.current.length - 1; i >= index; i--) {
      // move each to i+1
      const b = boxes.current[i];
      promises.push(
        gsap.to(b.position, {
          x: (i + 1) * spacing,
          duration: operationDuration / 1000,
          ease: "power2.out",
        })
      );
    }
    // add new box from left outside
    const newBox = createValueBox(value);
    newBox.position.set(index * spacing - 6, 0, 0);
    scene.add(newBox);
    // insert into boxes array at index
    boxes.current.splice(index, 0, newBox);
    // wait a tiny tick then animate new box in
    await Promise.all(promises);
    await gsap.to(newBox.position, {
      x: index * spacing,
      duration: operationDuration / 1000,
      ease: "power2.out",
    });
    await wait(300);
  };

  // Remove operation
  const doRemove = async (index) => {
    setOperationTitle(`Remove - Deletes element at index ${index}`);
    if (index < 0 || index >= boxes.current.length) {
      setOperationTitle("Invalid remove index");
      await wait(800);
      return;
    }
    const scene = sceneRef.current;
    const removed = boxes.current[index];

    // animate removed box drop & shrink & fade
    const matList = [];
    removed.traverse((n) => {
      if (n.material) matList.push(n.material);
    });
    matList.forEach((m) => {
      if (m.transparent === undefined) m.transparent = true;
    });

    // parallel: drop and shrink
    const t1 = gsap.to(removed.position, {
      y: -3,
      duration: operationDuration / 1000,
      ease: "power2.in",
    });
    const t2 = gsap.to(removed.scale, {
      x: 0.2,
      y: 0.2,
      z: 0.2,
      duration: operationDuration / 1000,
      ease: "power2.in",
    });
    // fade text/plane materials if any
    const fades = matList.map((m) =>
      gsap.to(m, {
        opacity: 0,
        duration: operationDuration / 1000,
        ease: "power2.in",
      })
    );
    await Promise.all([t1, t2, ...fades]);

    // remove from scene
    scene.remove(removed);

    // shift left the rest
    const promises = [];
    for (let i = index + 1; i < boxes.current.length; i++) {
      const b = boxes.current[i];
      promises.push(
        gsap.to(b.position, {
          x: (i - 1) * spacing,
          duration: operationDuration / 1000,
          ease: "power2.out",
        })
      );
    }
    // remove from array
    boxes.current.splice(index, 1);
    await Promise.all(promises);
    await wait(300);
  };

  // Swap operation
  const doSwap = async (i1, i2) => {
    setOperationTitle(`Swap - Exchanges values at ${i1} and ${i2}`);
    if (
      i1 < 0 ||
      i2 < 0 ||
      i1 >= boxes.current.length ||
      i2 >= boxes.current.length
    ) {
      setOperationTitle("Invalid swap indexes");
      await wait(800);
      return;
    }
    if (i1 === i2) {
      setOperationTitle("Same index; nothing to swap");
      await wait(800);
      return;
    }
    // visual highlight: scale up both briefly
    const b1 = boxes.current[i1];
    const b2 = boxes.current[i2];

    const pos1 = b1.position.x;
    const pos2 = b2.position.x;

    // parallel move
    const p1 = gsap.to(b1.position, {
      x: pos2,
      duration: operationDuration / 1000,
      ease: "power2.inOut",
    });
    const p2 = gsap.to(b2.position, {
      x: pos1,
      duration: operationDuration / 1000,
      ease: "power2.inOut",
    });

    // swap in array after animation completes
    await Promise.all([p1, p2]);
    [boxes.current[i1], boxes.current[i2]] = [
      boxes.current[i2],
      boxes.current[i1],
    ];
    await wait(300);
  };

  // -------------------------
  // Sequence runner (example sequence)
  // -------------------------
  const runSequence = async () => {
    // Wait a bit at start
    await wait(600);

    // Append 11
    await doAppend(11);

    // small pause
    await wait(300);

    // Insert 99 at index 1
    await doInsert(1, 99);

    await wait(300);

    // Remove at index 2
    await doRemove(2);

    await wait(300);

    // Swap index 0 and 2 (if valid)
    await doSwap(0, 2);

    // After sequence, change title
    setOperationTitle("Sequence complete");
  };

  // -------------------------
  // Render
  // -------------------------
  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Home;
