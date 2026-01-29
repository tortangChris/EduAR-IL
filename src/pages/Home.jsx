import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as THREE from "three";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const sceneRef = useRef(null);
  const camera3DRef = useRef(null);
  const rendererRef = useRef(null);
  const cubesRef = useRef([]);

  const SCALE_FACTOR = 0.5;

  // ✅ mouse drag state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

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

    threeRef.current.innerHTML = "";
    threeRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    camera3DRef.current = camera;
    rendererRef.current = renderer;
    cubesRef.current = [];

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(0, 0, 500);
    scene.add(light);

    // ✅ Mouse events for rotation
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  /** Dispose Three.js **/
  const disposeThreeJS = () => {
    if (rendererRef.current) {
      rendererRef.current.domElement.removeEventListener(
        "mousedown",
        onMouseDown,
      );
      rendererRef.current.domElement.removeEventListener(
        "mousemove",
        onMouseMove,
      );
      window.removeEventListener("mouseup", onMouseUp);

      rendererRef.current.dispose();
      rendererRef.current.domElement.remove();
    }
    sceneRef.current = null;
    camera3DRef.current = null;
    rendererRef.current = null;
    cubesRef.current = [];
  };

  /** 🖱️ Mouse Handlers **/
  const onMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const cube = cubesRef.current[0];
    if (!cube) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    // ✅ rotation speed
    cube.rotation.y += dx * 0.01;
    cube.rotation.x += dy * 0.01;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rendererRef.current.render(sceneRef.current, camera3DRef.current);
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  /** Render Cube **/
  const renderCubes = (predictions) => {
    const scene = sceneRef.current;
    if (!scene) return;

    let cube = cubesRef.current[0];
    const [x, y, width, height] = predictions[0].bbox;

    const scaledW = width * SCALE_FACTOR;
    const scaledH = height * SCALE_FACTOR;
    const scaledD = (Math.min(width, height) / 2) * SCALE_FACTOR;

    if (!cube) {
      const geometry = new THREE.BoxGeometry(scaledW, scaledH, scaledD);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00, // hard color
        metalness: 0.2,
        roughness: 0.3,
      });

      cube = new THREE.Mesh(geometry, material);

      // ✅ highlighted edges
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xffff00 }),
      );
      cube.add(line);

      scene.add(cube);
      cubesRef.current.push(cube);
    } else {
      cube.geometry.dispose();
      cube.geometry = new THREE.BoxGeometry(scaledW, scaledH, scaledD);
    }

    cube.position.set(
      x + width / 2,
      videoRef.current.videoHeight - y - height / 2,
      0,
    );

    rendererRef.current.render(scene, camera3DRef.current);
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

        if (predictions.length > 0) {
          const first = predictions[0];
          setDetectedObject(
            `${first.class} (${(first.score * 100).toFixed(1)}%)`,
          );

          renderCubes([first]);

          const [x, y, width, height] = first.bbox;
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    if (isCameraOn) loop();
    return () => cancelAnimationFrame(animationId);
  }, [isCameraOn, model, isDetecting]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6 text-white">
      <h2 className="text-3xl font-bold mb-3 text-green-400">
        AR Object Detection (Drag to Rotate)
      </h2>

      {detectedObject && (
        <div className="bg-green-600 bg-opacity-20 px-5 py-2 rounded-xl mb-4 text-lg font-semibold">
          Detected: {detectedObject}
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
          <button
            onClick={stopCamera}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold"
          >
            Stop Camera
          </button>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-lg">
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
    </div>
  );
};

export default Home;
