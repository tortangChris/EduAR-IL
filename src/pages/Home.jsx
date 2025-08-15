import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

const Home = () => {
  const mountRef = useRef(null);

  // Three.js / XR refs
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const xrSessionRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const hitTestViewerSpaceRef = useRef(null);

  // array/group refs
  const arrayGroupRef = useRef(null); // group that holds the boxes
  const boxMeshesRef = useRef([]); // actual box mesh objects
  const placeholdersRef = useRef([]);
  const reticleRef = useRef(null);

  // UI state
  const [placed, setPlaced] = useState(false);
  const spacing = 0.25; // meters (real world scale)
  const boxScale = 0.12; // 0.12m cubes (table-top)
  const totalSlots = 6;

  useEffect(() => {
    const mount = mountRef.current;

    // Scene + camera + renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      mount.clientWidth / mount.clientHeight,
      0.01,
      20
    );
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.xr.enabled = true;
    renderer.setAnimationLoop(render);
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // Controls for non-XR preview (desktop)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;


    // Lights (soft)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 4, 2);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Create group that will contain the array (initially invisible until placed in AR)
    const arrayGroup = new THREE.Group();
    arrayGroup.scale.set(boxScale, boxScale, boxScale);
    arrayGroup.visible = true; // for desktop preview we keep it visible
    arrayGroupRef.current = arrayGroup;
    scene.add(arrayGroup);

    // placeholders (visual faint boxes) to indicate total slots
    for (let i = 0; i < totalSlots; i++) {
      const placeholder = createPlaceholder();
      placeholder.position.set(i * spacing, 0, 0);
      arrayGroup.add(placeholder);
      placeholdersRef.current.push(placeholder);

      const idxLabel = createTextLabel(i, 64);
      idxLabel.position.set(i * spacing, -0.16, 0); // under placeholder (scaled by boxScale)
      idxLabel.scale.set(1 / boxScale, 1 / boxScale, 1 / boxScale); // keep label readable
      arrayGroup.add(idxLabel);
    }

    // initial values (desktop preview)
    const initialValues = [1, 3, 5];
    initialValues.forEach((v, i) => {
      const mesh = createBox(v);
      mesh.position.set(i * spacing, 0, 0);
      arrayGroup.add(mesh);
      boxMeshesRef.current.push(mesh);
    });

    // Reticle to show hit-test position (flat ring)
    const reticle = createReticle();
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // AR Button
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test", "local-floor"],
    });
    // place ARButton into a container above the canvas so controls overlay remains accessible
    arButton.style.position = "absolute";
    arButton.style.top = "12px";
    arButton.style.right = "12px";
    arButton.style.zIndex = 1000;
    mount.appendChild(arButton);

    // Resize handler
    function onWindowResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // XR session start / end hooks
    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      xrSessionRef.current = session;

      // request a viewer reference space and a hit-test source
      const viewerSpace = await session.requestReferenceSpace("viewer");
      hitTestViewerSpaceRef.current = viewerSpace;

      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSourceRef.current = hitTestSource;

      session.addEventListener("select", onSelect); // tap to place the array
    });

    renderer.xr.addEventListener("sessionend", () => {
      // cleanup
      const s = xrSessionRef.current;
      if (s) {
        try {
          s.removeEventListener("select", onSelect);
        } catch (e) {}
      }
      xrSessionRef.current = null;
      hitTestSourceRef.current = null;
      hitTestViewerSpaceRef.current = null;
      setPlaced(false);
      // optionally hide reticle
      if (reticleRef.current) reticleRef.current.visible = false;
    });

    // Render loop (works for both AR and non-AR)
    function render(timestamp, frame) {
      // If we have a frame and hit-test source (AR), try to update reticle
      if (frame && hitTestSourceRef.current) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(
          hitTestSourceRef.current
        );

        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          if (pose) {
            reticleRef.current.visible = true;
            reticleRef.current.matrix.fromArray(pose.transform.matrix);
            reticleRef.current.matrix.decompose(
              reticleRef.current.position,
              reticleRef.current.quaternion,
              reticleRef.current.scale
            );
          }
        } else {
          reticleRef.current.visible = false;
        }
      }

      // Normal updates for desktop preview
      if (!renderer.xr.isPresenting) {
        controls.update();
      }

      renderer.render(scene, camera);
    }

    // Handle user "select" in AR -> place arrayGroup at reticle's world position
    function onSelect() {
      const ret = reticleRef.current;
      if (!ret || !ret.visible) return;
      // Put arrayGroup at reticle position & align rotation
      arrayGroupRef.current.position.copy(ret.position);
      arrayGroupRef.current.quaternion.copy(ret.quaternion);
      // Lift slightly above surface so boxes don't clip
      arrayGroupRef.current.position.y += 0.01;
      setPlaced(true);
    }

    // cleanup on unmount
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (renderer && renderer.domElement) {
        try {
          mount.removeChild(renderer.domElement);
        } catch (e) {}
      }
      // remove ARButton if still present
      try {
        mount.removeChild(arButton);
      } catch (e) {}
      // dispose renderer
      if (renderer) {
        renderer.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- 3D helper creators ----------------
  const createBox = (value) => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const m = new THREE.Mesh(geo, mat);

    // value plane (slightly in front)
    const txtTex = createTextTexture(value, "black", "white", 128);
    const txtMat = new THREE.MeshBasicMaterial({
      map: txtTex,
      transparent: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), txtMat);
    plane.position.z = 0.51;
    m.add(plane);

    return m;
  };

  const createPlaceholder = () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      opacity: 0.25,
      transparent: true,
    });
    return new THREE.Mesh(geo, mat);
  };

  const createTextLabel = (text, fontSize = 80) => {
    const tex = createTextTexture(text, "white", "transparent", fontSize);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.28), mat);



  };

  const createTextTexture = (
@@ -116,133 +262,224 @@ const Home = () => {
    fontSize = 100
  ) => {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // background
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0, 0, size, size);
    }
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(text), size / 2, size / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  };

  const createReticle = () => {
    // a ring with a small plane so it faces the surface
    const geometry = new THREE.RingGeometry(0.06, 0.08, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    // Add short pointer plane so it bills slightly above surface
    const dotGeo = new THREE.CircleGeometry(0.02, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.y = 0.001;
    ring.add(dot);
    return ring;
  };

  // ---------------- Array operations (operate on arrayGroupRef & boxMeshesRef) -------------
  const appendValue = (value) => {
    if (boxMeshesRef.current.length >= totalSlots) {
      alert("No more space to append (total slots reached).");
      return;
    }
    const grp = arrayGroupRef.current;
    const idx = boxMeshesRef.current.length;
    const box = createBox(value);
    box.position.set(idx * spacing + 0.6, 0, 0); // start offset before animation
    grp.add(box);
    boxMeshesRef.current.push(box);
    gsap.to(box.position, { x: idx * spacing, duration: 0.8 });

  };

  const insertValue = (index, value) => {
    if (boxMeshesRef.current.length >= totalSlots) {
      alert("No more space to insert (total slots reached).");
      return;
    }
    if (index < 0 || index > boxMeshesRef.current.length) {
      alert("Index out of range.");
      return;
    }
    // shift right
    for (let i = index; i < boxMeshesRef.current.length; i++) {
      const b = boxMeshesRef.current[i];
      gsap.to(b.position, { x: (i + 1) * spacing, duration: 0.6 });
    }
    const box = createBox(value);
    box.position.set(index * spacing - 0.6, 0, 0);
    arrayGroupRef.current.add(box);
    boxMeshesRef.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 0.8 });
  };

  const removeValue = (index) => {
    if (index < 0 || index >= boxMeshesRef.current.length) {
      alert("Index out of range.");
      return;
    }
    const removed = boxMeshesRef.current[index];
    gsap.to(removed.position, {
      y: -0.6,
      duration: 0.7,
      onComplete: () => {
        try {
          arrayGroupRef.current.remove(removed);
        } catch (e) {}
      },
    });
    // shift left the ones to the right
    for (let i = index + 1; i < boxMeshesRef.current.length; i++) {
      const b = boxMeshesRef.current[i];
      gsap.to(b.position, { x: (i - 1) * spacing, duration: 0.6 });
    }
    boxMeshesRef.current.splice(index, 1);
  };

  const swapValues = (i1, i2) => {
    if (
      i1 < 0 ||
      i2 < 0 ||
      i1 >= boxMeshesRef.current.length ||
      i2 >= boxMeshesRef.current.length
    ) {
      alert("Index out of range.");
      return;
    }
    if (i1 === i2) return;
    const b1 = boxMeshesRef.current[i1];
    const b2 = boxMeshesRef.current[i2];
    const p1 = b1.position.x;
    const p2 = b2.position.x;
    gsap.to(b1.position, { x: p2, duration: 0.7 });
    gsap.to(b2.position, { x: p1, duration: 0.7 });
    // swap in array
    [boxMeshesRef.current[i1], boxMeshesRef.current[i2]] = [
      boxMeshesRef.current[i2],
      boxMeshesRef.current[i1],
    ];
  };

  // ---------------- UI handlers (prompt-based) ----------------
  const handleAppend = () => {
    const raw = prompt("Enter value to append (number or text):");
    if (raw === null) return;
    appendValue(raw);
  };

  const handleInsert = () => {
    const idx = parseInt(prompt("Enter index to insert at (0-based):"), 10);
    if (Number.isNaN(idx)) return;
    const val = prompt("Enter value to insert:");
    if (val === null) return;
    insertValue(idx, val);
  };

  const handleDelete = () => {
    const idx = parseInt(prompt("Enter index to delete (0-based):"), 10);
    if (Number.isNaN(idx)) return;
    removeValue(idx);
  };

  const handleSwap = () => {
    const i1 = parseInt(prompt("Enter first index to swap (0-based):"), 10);
    if (Number.isNaN(i1)) return;
    const i2 = parseInt(prompt("Enter second index to swap (0-based):"), 10);
    if (Number.isNaN(i2)) return;
    swapValues(i1, i2);
  };

  // ---------------- Render UI ----------------
  // Inline styles so you can drop in anywhere; z-index high so visible in AR overlay
  const panelStyle = {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "rgba(20,20,20,0.6)",
    padding: 8,
    borderRadius: 8,
    color: "white",
    fontFamily: "sans-serif",
  };

  const btnStyle = {
    padding: "6px 10px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  };

  const smallHintStyle = {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 6,
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Control panel */}
      <div style={panelStyle}>
        <button style={btnStyle} onClick={handleAppend}>














          Append
        </button>
        <button style={btnStyle} onClick={handleInsert}>






          Insert
        </button>
        <button style={btnStyle} onClick={handleDelete}>





          Delete
        </button>
        <button style={btnStyle} onClick={handleSwap}>






          Swap
        </button>

        <div style={smallHintStyle}>
          {rendererRef.current &&
          rendererRef.current.xr &&
          rendererRef.current.xr.isPresenting
            ? placed
              ? "AR placed. Tap buttons to modify the array."
              : "Tap the screen to place the array (reticle shows placement)."
            : "Preview mode: use mouse to orbit. Click 'Enter AR' button to use AR."}
        </div>
      </div>

      {/* three.js mount point */}
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />
    </div>
  );
};

export default Home;
