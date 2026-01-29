import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showScanning, setShowScanning] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("Model loaded");
      } catch (err) {
        setError("Failed to load TensorFlow model.");
        console.error(err);
      }
    };
    loadModel();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      setIsCameraOn(true);
      setError("");
      setDetectedObject(null);
      setShowScanning(true);
      setIsDetecting(false);

      setTimeout(() => {
        setShowScanning(false);
        setIsDetecting(true);
      }, 3000);
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());

    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsDetecting(false);
    setShowScanning(false);
    clearCanvas();
  };

  // Clear canvas
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Detection + scanning loop
  useEffect(() => {
    let animationId;
    let scanY = 0;
    let scanDirection = 1;
    let glowAlpha = 0.5;
    let glowIncrement = 0.02;

    const loop = async () => {
      const ctx = canvasRef.current?.getContext("2d");
      const video = videoRef.current;
      if (!ctx || !video) return;

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Show scanning line effect
      if (showScanning) {
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Glowing scan line
        ctx.strokeStyle = `rgba(0, 255, 0, ${glowAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(ctx.canvas.width, scanY);
        ctx.stroke();

        // Update scan position
        scanY += 4 * scanDirection;
        if (scanY > ctx.canvas.height || scanY < 0) scanDirection *= -1;

        // Pulsating effect
        glowAlpha += glowIncrement;
        if (glowAlpha >= 0.8 || glowAlpha <= 0.3) glowIncrement *= -1;
      }

      // Object detection after scanning
      if (isDetecting && model && video.readyState >= 2) {
        const predictions = await model.detect(video);

        ctx.lineWidth = 2;
        ctx.font = "20px Arial";
        ctx.strokeStyle = "rgba(255,0,0,0.8)";
        ctx.fillStyle = "rgba(255,0,0,0.8)";

        if (predictions.length > 0) {
          const first = predictions[0];
          setDetectedObject(
            `${first.class} (${(first.score * 100).toFixed(1)}%)`,
          );
          setIsDetecting(false);

          const [x, y, width, height] = first.bbox;
          ctx.strokeRect(x, y, width, height);
          ctx.fillText(
            `${first.class} (${(first.score * 100).toFixed(1)}%)`,
            x,
            y > 25 ? y - 8 : y + 25,
          );
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    if (isCameraOn) loop();

    return () => cancelAnimationFrame(animationId);
  }, [isCameraOn, model, isDetecting, showScanning]);

  // Restart detection
  const handleDetectAgain = () => {
    setDetectedObject(null);
    clearCanvas();
    setShowScanning(true);
    setIsDetecting(false);

    setTimeout(() => {
      setShowScanning(false);
      setIsDetecting(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6 text-white">
      <h2 className="text-3xl font-bold mb-3 text-green-400">
        AR Object Detection
      </h2>

      {detectedObject && (
        <div className="bg-green-600 bg-opacity-20 px-5 py-2 rounded-xl mb-4 text-lg font-semibold transition-all duration-500">
          Detected: {detectedObject}
        </div>
      )}

      <div className="mb-5 flex flex-wrap justify-center gap-3">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            className="px-6 py-2 rounded-lg bg-green-400 text-black font-semibold shadow-md hover:shadow-lg transition"
          >
            Enable Camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              Stop Camera
            </button>
            {!isDetecting && !showScanning && (
              <button
                onClick={handleDetectAgain}
                className="px-6 py-2 rounded-lg bg-cyan-400 text-black font-semibold shadow-md hover:shadow-lg transition"
              >
                Detect Again
              </button>
            )}
          </>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`${
            isMobile ? "w-[90vw] max-h-[70vh]" : "w-[600px] max-h-[400px]"
          } object-cover block`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute top-0 left-0 ${
            isMobile ? "w-[90vw] max-h-[70vh]" : "w-[600px] max-h-[400px]"
          } pointer-events-none`}
        />
      </div>
    </div>
  );
};

export default Home;
