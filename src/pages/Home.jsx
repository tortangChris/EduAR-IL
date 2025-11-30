import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);

  useEffect(() => {
    let model;

    const load = async () => {
      try {
        // Load model
        model = await cocoSsd.load();
        setStatus("Model Loaded ✔️");

        // Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setStatus("Camera Running ✔️ Detecting objects...");
        detectLoop();
      } catch (e) {
        console.error(e);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const detectLoop = async () => {
      if (!model || !videoRef.current) {
        return requestAnimationFrame(detectLoop);
      }

      const predictions = await model.detect(videoRef.current);
      drawBoxes(predictions);

      requestAnimationFrame(detectLoop);
    };

    const drawBoxes = (predictions) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter only cell phones
      const phones = predictions.filter((p) => p.class === "cell phone");

      setArrayCount(phones.length);

      phones.forEach((p, index) => {
        const [x, y, width, height] = p.bbox;

        // Draw rectangle
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Label background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y - 30, width, 30);

        // Label text w/ array index
        ctx.fillStyle = "#00ff00";
        ctx.font = "20px Arial";
        ctx.fillText(`cellphone[${index}]`, x + 5, y - 10);
      });
    };

    load();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "12px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>EduAR – Array Detection Demo</h1>

      <p style={{ textAlign: "center", marginTop: "4px" }}>{status}</p>

      <p style={{ textAlign: "center", marginTop: "6px", fontSize: "1.1rem" }}>
        📱 Cellphones detected as Array elements: <strong>{arrayCount}</strong>
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
        />

        {/* bounding boxes layer */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Home;
