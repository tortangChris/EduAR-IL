import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

// WeeksArrayAR: WebXR AR port of your Three.js visualizer
// Notes:
// - This single-file React component uses three.js WebXR hit-test (reticle) to place
//   the array visualizer in the real world. Tap the screen to place the visualizer
//   where the reticle is. Use the UI buttons to Append / Insert / Delete / Swap.
// - Must be served over HTTPS and opened on a WebXR-compatible mobile browser
//   (e.g., Chrome for Android with WebXR/ARCore support).

export default function WeeksArrayAR() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const boxes = useRef([]); // meshes representing values
  const placeholders = useRef([]);
  const rootRef = useRef(null); // root group placed in AR
  const reticleRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const localReferenceSpaceRef = useRef(null);

  const spacing = 0.25; // meters
  const totalSlots = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [inputValues, setInputValues] = useState({
    value: "",
    index1: "",
    index2: "",
  });
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    // Prevent rendering in desktop portrait constraint is not relevant for AR mode
    // but we keep the same UI flow: AR will be available on compatible devices.

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    mountRef.current.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Root group that'll contain our placeholders/boxes when placed
    const root = new THREE.Group();
    root.visible = false; // hidden until user places it
    scene.add(root);
    rootRef.current = root;

    // Reticle for hit-test
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // Renderer + AR button
    document.body.style.touchAction = "none"; // required for some gestures

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    mountRef.current.appendChild(arButton);

    // Create placeholders (visual guides inside root)
    for (let i = 0; i < totalSlots; i++) {
      const placeholder = createEmptyBox();
      placeholder.position.set(
        i * spacing - ((totalSlots - 1) * spacing) / 2,
        0,
        0
      );
      root.add(placeholder);
      placeholders.current.push(placeholder);

      const label = createTextLabel(i);
      label.position.set(
        i * spacing - ((totalSlots - 1) * spacing) / 2,
        -0.08,
        0
      );
      root.add(label);
    }

    // initial values
    const initial = [1, 3, 5];
    initial.forEach((v, i) => {
      const b = createBox(v);
      b.position.set(i * spacing - ((totalSlots - 1) * spacing) / 2, 0, 0);
      root.add(b);
      boxes.current.push(b);
    });

    // XR Session handling
    let xrSession = null;

    const onSessionStart = async (session) => {
      xrSession = session;
      renderer.xr.setSession(session);

      // request reference space and hit-test source
      const refSpace = await session.requestReferenceSpace("local");
      localReferenceSpaceRef.current = refSpace;

      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSourceRef.current = hitTestSource;

      session.addEventListener("end", onSessionEnd);

      // Tap to place root at reticle
      const onSelect = () => {
        if (reticle.visible && root) {
          root.position.setFromMatrixPosition(reticle.matrix);
          root.quaternion.setFromRotationMatrix(reticle.matrix);
          root.visible = true;
          setPlaced(true);
        }
      };
      session.addEventListener("select", onSelect);
    };

    const onSessionEnd = () => {
      xrSession = null;
      hitTestSourceRef.current && hitTestSourceRef.current.cancel();
      hitTestSourceRef.current = null;
      localReferenceSpaceRef.current = null;
      setPlaced(false);
    };

    // animation loop
    const clock = new THREE.Clock();
    let rafId;

    function render(time, frame) {
      if (frame) {
        const referenceSpace = localReferenceSpaceRef.current;
        const viewerPose = frame.getViewerPose(referenceSpace);

        if (hitTestSourceRef.current && viewerPose) {
          const hitTestResults = frame.getHitTestResults(
            hitTestSourceRef.current
          );
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    const animate = (timestamp, frame) => {
      rafId = renderer.setAnimationLoop((time, frame) => render(time, frame));
    };

    // Hook into start of XR sessions to set up hit-test
    renderer.xr.addEventListener("sessionstart", (e) =>
      onSessionStart(e.session)
    );

    // start traditional loop for non-XR preview on desktop (optional)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // gracefully cleanup
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    renderer.setAnimationLoop((time, frame) => render(time, frame));

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);
      if (xrSession) xrSession.end();
      // dispose objects
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry && child.geometry.dispose();
          if (Array.isArray(child.material))
            child.material.forEach((m) => m.dispose());
          else child.material && child.material.dispose();
          if (child.material && child.material.map)
            child.material.map.dispose();
        }
      });
      if (mountRef.current && renderer.domElement)
        mountRef.current.removeChild(renderer.domElement);
      // remove AR button if still present
      try {
        arButton.remove();
      } catch (e) {}
    };
  }, []);

  // ---- Helpers to create boxes, placeholders, labels ----
  const createBox = (value) => {
    const geometry = new THREE.BoxGeometry(0.18, 0.12, 0.06);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    const texture = createTextTexture(value, "black", "white", 64);
    const textMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), textMat);
    plane.position.z = 0.035 + 0.001;
    mesh.add(plane);
    return mesh;
  };

  const createEmptyBox = () => {
    const geometry = new THREE.BoxGeometry(0.18, 0.12, 0.06);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      opacity: 0.25,
      transparent: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  const createTextLabel = (value) => {
    const texture = createTextTexture(value, "white", "transparent", 48);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), mat);
  };

  const createTextTexture = (
    text,
    color = "black",
    bg = "white",
    fontSize = 64
  ) => {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);
    if (bg && bg !== "transparent") {
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

  // ---- Array operations but working on the root group placed in AR ----
  const appendValue = (value) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    if (boxes.current.length >= totalSlots) return;
    const index = boxes.current.length;
    const box = createBox(value);
    box.position.set(
      index * spacing - ((totalSlots - 1) * spacing) / 2 + 0.5,
      0,
      0
    );
    root.add(box);
    boxes.current.push(box);
    gsap.to(box.position, {
      x: index * spacing - ((totalSlots - 1) * spacing) / 2,
      duration: 1,
    });
  };

  const insertValue = (index, value) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    if (boxes.current.length >= totalSlots) return;
    if (index < 0 || index > boxes.current.length) return;

    for (let i = index; i < boxes.current.length; i++) {
      const b = boxes.current[i];
      gsap.to(b.position, {
        x: (i + 1) * spacing - ((totalSlots - 1) * spacing) / 2,
        duration: 0.8,
      });
    }
    const box = createBox(value);
    box.position.set(
      index * spacing - ((totalSlots - 1) * spacing) / 2 - 0.5,
      0,
      0
    );
    root.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, {
      x: index * spacing - ((totalSlots - 1) * spacing) / 2,
      duration: 0.8,
    });
  };

  const removeValue = (index) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    if (index < 0 || index >= boxes.current.length) return;
    const removed = boxes.current[index];
    gsap.to(removed.position, {
      y: -0.2,
      duration: 0.8,
      onComplete: () => {
        root.remove(removed);
        removed.geometry.dispose();
        if (Array.isArray(removed.material))
          removed.material.forEach((m) => m.dispose());
        else removed.material.dispose();
      },
    });
    for (let i = index + 1; i < boxes.current.length; i++) {
      const b = boxes.current[i];
      gsap.to(b.position, {
        x: (i - 1) * spacing - ((totalSlots - 1) * spacing) / 2,
        duration: 0.8,
      });
    }
    boxes.current.splice(index, 1);
  };

  const swapValues = (i1, i2) => {
    if (
      i1 < 0 ||
      i2 < 0 ||
      i1 >= boxes.current.length ||
      i2 >= boxes.current.length
    )
      return;
    const b1 = boxes.current[i1];
    const b2 = boxes.current[i2];
    const x1 = b1.position.x;
    const x2 = b2.position.x;
    gsap.to(b1.position, { x: x2, duration: 0.8 });
    gsap.to(b2.position, { x: x1, duration: 0.8 });
    [boxes.current[i1], boxes.current[i2]] = [
      boxes.current[i2],
      boxes.current[i1],
    ];
  };

  // ---- Modal handlers ----
  const handleDone = () => {
    if (modalType === "append" && inputValues.value !== "")
      appendValue(Number(inputValues.value));
    else if (
      modalType === "insert" &&
      inputValues.value !== "" &&
      inputValues.index1 !== ""
    )
      insertValue(Number(inputValues.index1), Number(inputValues.value));
    else if (modalType === "delete" && inputValues.index1 !== "")
      removeValue(Number(inputValues.index1));
    else if (
      modalType === "swap" &&
      inputValues.index1 !== "" &&
      inputValues.index2 !== ""
    )
      swapValues(Number(inputValues.index1), Number(inputValues.index2));

    setInputValues({ value: "", index1: "", index2: "" });
    setModalOpen(false);
  };

  return (
    <div className="w-full h-screen relative">
      {/* Top small instruction bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-black/40 rounded-md px-3 py-1 text-white text-sm">
        {placed
          ? "Visualizer placed — use buttons to modify"
          : "Move device until reticle appears, then tap the screen to place"}
      </div>

      {/* Buttons */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex flex-row gap-2">
        {["append", "insert", "delete", "swap"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setModalType(type);
              setModalOpen(true);
            }}
            className="px-3 py-2 rounded-lg border bg-black/60 text-white border-white/50 hover:opacity-90 transition text-sm"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* AR mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Modal */}
      {modalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h3>

            {(modalType === "append" || modalType === "insert") && (
              <div className="mb-3">
                <label className="block text-sm font-medium">Value (v=)</label>
                <input
                  type="number"
                  value={inputValues.value}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, value: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            )}

            {(modalType === "insert" ||
              modalType === "delete" ||
              modalType === "swap") && (
              <div className="mb-3">
                <label className="block text-sm font-medium">Index (i=)</label>
                <input
                  type="number"
                  value={inputValues.index1}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, index1: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            )}

            {modalType === "swap" && (
              <div className="mb-3">
                <label className="block text-sm font-medium">
                  Index 2 (i=)
                </label>
                <input
                  type="number"
                  value={inputValues.index2}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, index2: e.target.value })
                  }
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 rounded bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
