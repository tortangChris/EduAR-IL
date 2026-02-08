import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as THREE from "three";
import "@tensorflow/tfjs";

const ARArrayDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Array data
  const [data] = useState([10, 20, 30, 40]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);

  const sceneRef = useRef(null);
  const camera3DRef = useRef(null);
  const rendererRef = useRef(null);
  const arrayGroupRef = useRef(null);
  const boxMeshesRef = useRef([]);

  const SCALE_FACTOR = 1; // Smaller scale for array

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  /** Disable scroll **/
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, []);

  /** Load model **/
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  /** Start Camera **/
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    videoRef.current.srcObject = stream;

    setIsCameraOn(true);
    setIsDetecting(true);
    initThreeJS();
  };

  /** Stop Camera **/
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsDetecting(false);
    setDetectedObject(null);
    disposeThreeJS();
  };

  /** Three.js Setup **/
  const initThreeJS = () => {
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      0,
      width,
      height,
      0,
      -1000,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.touchAction = "none";

    threeRef.current.innerHTML = "";
    threeRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    camera3DRef.current = camera;
    rendererRef.current = renderer;

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(0, 0, 500);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    renderer.domElement.addEventListener("mousedown", onPointerDown);
    renderer.domElement.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    renderer.domElement.addEventListener("touchstart", onPointerDown, {
      passive: false,
    });
    renderer.domElement.addEventListener("touchmove", onPointerMove, {
      passive: false,
    });
    window.addEventListener("touchend", onPointerUp);
  };

  /** Dispose Three.js **/
  const disposeThreeJS = () => {
    if (rendererRef.current) {
      const el = rendererRef.current.domElement;

      el.removeEventListener("mousedown", onPointerDown);
      el.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);

      el.removeEventListener("touchstart", onPointerDown);
      el.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      rendererRef.current.dispose();
      el.remove();
    }
    sceneRef.current = null;
    camera3DRef.current = null;
    rendererRef.current = null;
    arrayGroupRef.current = null;
    boxMeshesRef.current = [];
  };

  /** Pointer Handlers **/
  const getPointerPos = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onPointerDown = (e) => {
    e.preventDefault();

    // Check if clicking on a box
    const pos = getPointerPos(e);
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const x = pos.x - rect.left;
    const y = pos.y - rect.top;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera3DRef.current);

    if (arrayGroupRef.current) {
      const intersects = raycaster.intersectObjects(
        arrayGroupRef.current.children,
        true,
      );

      if (intersects.length > 0) {
        // Find which box was clicked
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== arrayGroupRef.current) {
          obj = obj.parent;
        }

        const boxIndex = arrayGroupRef.current.children.findIndex(
          (child) => child === obj,
        );

        if (boxIndex !== -1 && boxIndex < data.length) {
          setSelectedBox(boxIndex);
          setShowPanel(true);
          setPage(0);
          return;
        }
      }
    }

    isDraggingRef.current = true;
    lastPosRef.current = pos;
  };

  const onPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const arrayGroup = arrayGroupRef.current;
    if (!arrayGroup) return;

    const pos = getPointerPos(e);
    const dx = pos.x - lastPosRef.current.x;
    const dy = pos.y - lastPosRef.current.y;

    arrayGroup.rotation.y += dx * 0.01;
    arrayGroup.rotation.x += dy * 0.01;

    lastPosRef.current = pos;

    rendererRef.current.render(sceneRef.current, camera3DRef.current);
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  /** Create Array Structure **/
  const createArrayStructure = (x, y, width, height) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old array if exists
    if (arrayGroupRef.current) {
      scene.remove(arrayGroupRef.current);
      arrayGroupRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }

    const arrayGroup = new THREE.Group();

    const spacing = 100 * SCALE_FACTOR;
    const boxWidth = 80 * SCALE_FACTOR;
    const boxHeight = 60 * SCALE_FACTOR;
    const boxDepth = 50 * SCALE_FACTOR;

    const mid = (data.length - 1) / 2;

    // Title text
    const titleMesh = createTextMesh("Array Data Structure", 15 * SCALE_FACTOR);
    titleMesh.position.set(0, 150 * SCALE_FACTOR, 0);
    arrayGroup.add(titleMesh);

    boxMeshesRef.current = [];

    // Create boxes
    data.forEach((value, i) => {
      const boxGroup = new THREE.Group();

      const xPos = (i - mid) * spacing;

      // Main box
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      const color =
        selectedBox === i ? 0xfacc15 : i % 2 === 0 ? 0x60a5fa : 0x34d399;
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.4,
      });

      const box = new THREE.Mesh(geometry, material);
      box.position.set(xPos, 0, 0);
      boxGroup.add(box);

      // Value text
      const valueText = createTextMesh(String(value), 12 * SCALE_FACTOR);
      valueText.position.set(xPos, 0, boxDepth / 2 + 2);
      boxGroup.add(valueText);

      // Index text
      const indexText = createTextMesh(`[${i}]`, 8 * SCALE_FACTOR, 0xffff00);
      indexText.position.set(
        xPos,
        -boxHeight / 2 - 10 * SCALE_FACTOR,
        boxDepth / 2 + 2,
      );
      boxGroup.add(indexText);

      // Selection label
      if (selectedBox === i) {
        const label = createTextMesh(
          `Value ${value} at index ${i}`,
          8 * SCALE_FACTOR,
          0xfde68a,
        );
        label.position.set(xPos, boxHeight / 2 + 30 * SCALE_FACTOR, 0);
        boxGroup.add(label);
      }

      arrayGroup.add(boxGroup);
      boxMeshesRef.current.push(boxGroup);
    });

    // Definition Panel
    if (showPanel && selectedBox !== null) {
      const panelGroup = createDefinitionPanel();
      panelGroup.position.set(300 * SCALE_FACTOR, 0, 0);
      arrayGroup.add(panelGroup);
    }

    // Position array at detected object center
    arrayGroup.position.set(
      x + width / 2,
      videoRef.current.videoHeight - y - height / 2,
      0,
    );

    arrayGroupRef.current = arrayGroup;
    scene.add(arrayGroup);
  };

  /** Create Definition Panel **/
  const createDefinitionPanel = () => {
    const panelGroup = new THREE.Group();

    let content = "";
    if (page === 0) {
      content = `Index ${selectedBox}\nValue: ${data[selectedBox]}\nIndexes start from 0`;
    } else if (page === 1) {
      content = `Array Property:\nAccess time: O(1)\nContiguous memory`;
    } else {
      content = `Summary:\n${data.map((v, i) => `[${i}]→${v}`).join(" ")}`;
    }

    const panelText = createTextMesh(content, 10 * SCALE_FACTOR, 0xfde68a);
    panelGroup.add(panelText);

    const nextLabel = page < 2 ? "Next ▶" : "Close ✖";
    const buttonText = createTextMesh(nextLabel, 12 * SCALE_FACTOR, 0x38bdf8);
    buttonText.position.set(0, -100 * SCALE_FACTOR, 0);
    panelGroup.add(buttonText);

    return panelGroup;
  };

  /** Create Text Mesh (simplified) **/
  const createTextMesh = (text, size, color = 0xffffff) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.font = `${size * 10}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    const lines = text.split("\n");
    lines.forEach((line, i) => {
      context.fillText(line, 256, 128 + i * size * 12);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(size * 10, size * 5);
    return new THREE.Mesh(geometry, material);
  };

  /** Handle Next Button **/
  const handleNextClick = () => {
    if (page < 2) {
      setPage(page + 1);
    } else {
      setShowPanel(false);
      setSelectedBox(null);
    }
  };

  /** Detection Loop **/
  useEffect(() => {
    let animationId;

    const loop = async () => {
      const video = videoRef.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !video || !model) return;

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (video.readyState >= 2 && isDetecting) {
        const predictions = await model.detect(video);

        // Filter only person and cell phone
        const validObjects = predictions.filter(
          (p) => p.class === "person" || p.class === "cell phone",
        );

        if (validObjects.length > 0) {
          const first = validObjects[0];
          setDetectedObject(
            `${first.class} (${(first.score * 100).toFixed(1)}%)`,
          );

          // Create array structure at detected position
          createArrayStructure(
            first.bbox[0],
            first.bbox[1],
            first.bbox[2],
            first.bbox[3],
          );
        } else {
          // No valid object detected - remove array
          setDetectedObject(null);
          if (arrayGroupRef.current && sceneRef.current) {
            sceneRef.current.remove(arrayGroupRef.current);
            arrayGroupRef.current = null;
          }
        }
      }

      if (rendererRef.current && sceneRef.current && camera3DRef.current) {
        rendererRef.current.render(sceneRef.current, camera3DRef.current);
      }

      animationId = requestAnimationFrame(loop);
    };

    if (isCameraOn) loop();
    return () => cancelAnimationFrame(animationId);
  }, [isCameraOn, model, isDetecting, selectedBox, showPanel, page, data]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6 text-white overflow-hidden">
      <h2 className="text-3xl font-bold mb-3 text-green-400">
        AR Array Visualizer
      </h2>
      <p className="text-sm text-gray-400 mb-2">
        Point camera at a person or cell phone to see the 3D array
      </p>

      {detectedObject && (
        <div className="bg-green-600 bg-opacity-20 px-5 py-2 rounded-xl mb-4 text-lg font-semibold">
          Detected: {detectedObject}
        </div>
      )}

      {!detectedObject && isCameraOn && (
        <div className="bg-yellow-600 bg-opacity-20 px-5 py-2 rounded-xl mb-4 text-sm">
          Searching for person or cell phone...
        </div>
      )}

      <div className="mb-5 flex gap-3">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            className="px-6 py-2 rounded-lg bg-green-400 text-black font-semibold"
          >
            Enable Camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold"
            >
              Stop Camera
            </button>
            {showPanel && (
              <button
                onClick={handleNextClick}
                className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold"
              >
                {page < 2 ? "Next ▶" : "Close ✖"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-lg select-none">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="object-cover w-[600px] max-h-[400px] block"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-[600px] max-h-[400px] pointer-events-none"
        />
        <div
          ref={threeRef}
          className="absolute top-0 left-0 w-[600px] max-h-[400px]"
        />
      </div>

      <div className="mt-4 text-sm text-gray-400 text-center max-w-md">
        <p>• Tap on array boxes to see details</p>
        <p>• Drag to rotate the 3D array structure</p>
        <p>• Array disappears when object is not detected</p>
      </div>
    </div>
  );
};

export default ARArrayDetector;
