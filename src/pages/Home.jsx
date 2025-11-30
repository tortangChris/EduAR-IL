import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

// Helper to draw an arrow between two points (for linked list)
const drawArrow = (ctx, x1, y1, x2, y2) => {
  const headLen = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
};

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [linkedListCount, setLinkedListCount] = useState(0);
  const [debugLabels, setDebugLabels] = useState([]);
  const [concept, setConcept] = useState("");
  const [conceptDetail, setConceptDetail] = useState("");

  useEffect(() => {
    let model = null;
    let animationFrameId = null;
    let lastDetection = 0;
    const DETECT_INTERVAL = 200; // ~5 FPS

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
          setStatus("Camera Running ✔️ Detecting cups as linked list...");
          detectLoop();
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const analyzeScene = (predictions) => {
      const cups = predictions.filter(
        (p) => p.class === "cup" && p.score > 0.4
      );
      const cupCountLocal = cups.length;

      if (cupCountLocal >= 2) {
        const cupsSorted = [...cups].sort(
          (a, b) => a.bbox[0] - b.bbox[0]
        );
        const ys = cupsSorted.map((c) => c.bbox[1]);
        const maxY = Math.max(...ys);
        const minY = Math.min(...ys);
        const yRange = maxY - minY;

        // halos magkalevel ang y => naka-row, puwedeng linked list
        if (yRange < 80) {
          setConcept("Linked List");
          setConceptDetail(
            `Detected ${cupCountLocal} cup node(s) aligned in a row → modeled as a Singly Linked List (each node points to the next, last points to null).`
          );
          return;
        }
      }

      setConcept("");
      setConceptDetail("");
    };

    const draw = (predictions) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Linked list (cups) only ---
      const cups = predictions.filter(
        (p) => p.class === "cup" && p.score > 0.4
      );
      setLinkedListCount(cups.length);

      if (cups.length === 0) return;

      const cupsSorted = [...cups].sort(
        (a, b) => a.bbox[0] - b.bbox[0]
      );

      ctx.lineWidth = 2;

      cupsSorted.forEach((p, index) => {
        const [x, y, width, height] = p.bbox;
        const cx = x + width / 2;
        const cy = y + height / 2;

        // Node box
        ctx.strokeStyle = "#facc15";
        ctx.strokeRect(x, y, width, height);

        // Node label
        const label = `node[${index}]`;
        const labelHeight = 20;
        ctx.fillStyle = "#facc15";
        ctx.fillRect(x, y - labelHeight, width, labelHeight);

        ctx.fillStyle = "#0f172a";
        ctx.font = "14px Arial";
        ctx.fillText(label, x + 4, y - 4);

        // Arrow to next node
        if (index < cupsSorted.length - 1) {
          const next = cupsSorted[index + 1];
          const [nx, ny, nWidth, nHeight] = next.bbox;
          const nCx = nx + nWidth / 2;
          const nCy = ny + nHeight / 2;

          ctx.strokeStyle = "#facc15";
          ctx.fillStyle = "#facc15";
          drawArrow(ctx, cx + width / 2, cy, nCx - nWidth / 2, nCy);
        } else {
          // Last node → null
          ctx.fillStyle = "#facc15";
          ctx.font = "14px Arial";
          ctx.fillText("null", cx + width / 2 + 10, cy + 4);
        }
      });
    };

    const detectLoop = async () => {
      const now = performance.now();
      if (now - lastDetection >= DETECT_INTERVAL) {
        lastDetection = now;

        if (model && videoRef.current) {
          try {
            const predictions = await model.detect(videoRef.current);

            setDebugLabels(
              predictions.map(
                (p) => `${p.class} (${Math.round(p.score * 100)}%)`
              )
            );

            draw(predictions);
            analyzeScene(predictions);
          } catch (err) {
            console.error("Detection error:", err);
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    start();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
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
      <h1 style={{ textAlign: "center", marginBottom: "4px" }}>
        EduAR – Linked List Detection
      </h1>

      <p style={{ textAlign: "center" }}>{status}</p>

      <p style={{ textAlign: "center", marginTop: "6px" }}>
        🥤 Cups detected (linked list nodes):{" "}
        <strong>{linkedListCount}</strong>
      </p>

      {concept && (
        <div
          style={{
            maxWidth: "480px",
            margin: "8px auto",
            padding: "10px",
            borderRadius: "8px",
            background: "#111827",
            border: "1px solid #4B5563",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            🧠 Detected Data Structure:{" "}
            <span style={{ color: "#34D399" }}>{concept}</span>
          </h2>
          <p style={{ marginTop: "6px", fontSize: "0.9rem" }}>
            {conceptDetail}
          </p>
        </div>
      )}

      <div
        style={{
          background: "#1f2937",
          maxWidth: "480px",
          margin: "8px auto",
          padding: "8px",
          borderRadius: "8px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Debug (detected classes):</strong>
        {debugLabels.length === 0 ? (
          <div style={{ marginTop: "4px" }}>None</div>
        ) : (
          <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
            {debugLabels.map((lbl, i) => (
              <li key={i}>{lbl}</li>
            ))}
          </ul>
        )}
      </div>

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
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
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
