import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);
  const [debugLabels, setDebugLabels] = useState([]);

  useEffect(() => {
    let model = null;
    let animationFrameId = null;

    let lastDetection = 0;
    const DETECT_FPS = 200; // 200ms = ~5 FPS (smooth enough)

    const start = async () => {
      try {
        model = await cocoSsd.load();
        setStatus("Model Loaded ✔️");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setStatus("Camera Running ✔️");
          detectLoop();
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const detectLoop = async () => {
      const now = performance.now();

      if (now - lastDetection >= DETECT_FPS) {
        lastDetection = now;

        if (model && videoRef.current) {
          const predictions = await model.detect(videoRef.current);

          // show debug detected names
          setDebugLabels(
            predictions.map(
              (p) => `${p.class} (${Math.round(p.score * 100)}%)`
            )
          );

          draw(predictions);
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    const draw = (predictions) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter: only cell phone with score > 0.4
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );

      setArrayCount(phones.length);

      phones.forEach((p, index) => {
        const [x, y, width, height] = p.bbox;

        // Green box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Label box under the object
        const label = `index[${index}]`;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y + height, width, 30);

        ctx.fillStyle = "#00ff00";
        ctx.font = "20px Arial";
        ctx.fillText(label, x + 5, y + height + 22);
      });
    };

    start();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
      <h1 style={{ textAlign: "center" }}>EduAR – Array Detection</h1>

      <p style={{ textAlign: "center" }}>{status}</p>

      <p style={{ textAlign: "center", marginTop: "6px" }}>
        📱 Detected as array elements: <strong>{arrayCount}</strong>
      </p>

      {/* Debug list */}
      <div
        style={{
          background: "#1f2937",
          maxWidth: "480px",
          margin: "10px auto",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Debug:</strong>
        {debugLabels.length === 0 ? (
          <div>None</div>
        ) : (
          <ul style={{ marginTop: "6px", paddingLeft: "20px" }}>
            {debugLabels.map((lbl, i) => (
              <li key={i}>{lbl}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Video + Canvas */}
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
          muted
          playsInline
          style={{ width: "100%", borderRadius: "10px" }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Home;
