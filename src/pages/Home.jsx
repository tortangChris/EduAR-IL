import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);
  const [debugLabels, setDebugLabels] = useState([]);
  const [concept, setConcept] = useState("");
  const [conceptDetail, setConceptDetail] = useState("");

  useEffect(() => {
    let model = null;
    let animationFrameId = null;
    let lastDetection = 0;
    const DETECT_INTERVAL = 200; // ms (~5 FPS, less lag)

    const start = async () => {
      try {
        // Load detection model
        model = await cocoSsd.load();
        setStatus("Model Loaded ✔️");

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setStatus("Camera Running ✔️ Detecting objects...");
          detectLoop();
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const analyzeScene = (predictions) => {
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );
      const bottles = predictions.filter(
        (p) => p.class === "bottle" && p.score > 0.4
      );
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );
      const persons = predictions.filter(
        (p) => p.class === "person" && p.score > 0.4
      );

      // --- Queue rule (persons in a horizontal line) ---
      if (persons.length >= 2) {
        const ys = persons.map((p) => p.bbox[1]); // y positions
        const maxY = Math.max(...ys);
        const minY = Math.min(...ys);
        // if halos magkalevel ang y, assume line (queue)
        if (maxY - minY < 80) {
          setConcept("Queue (FIFO)");
          setConceptDetail(
            "Detected a line of people → behaves like a Queue (First In, First Out)."
          );
          return;
        }
      }

      // --- Stack rule (books stacked vertically) ---
      if (books.length >= 2) {
        const xs = books.map((b) => b.bbox[0]); // x positions
        const maxX = Math.max(...xs);
        const minX = Math.min(...xs);
        // if halos magkalevel ang x, assume vertical stack
        if (maxX - minX < 80) {
          setConcept("Stack (LIFO)");
          setConceptDetail(
            "Detected stacked books → behaves like a Stack (Last In, First Out)."
          );
          return;
        }
      }

      // --- Array rule (multiple similar objects: phones + bottles) ---
      const arrayLikeCount = phones.length + bottles.length;
      if (arrayLikeCount >= 2) {
        setConcept("Array");
        setConceptDetail(
          `Detected ${arrayLikeCount} similar objects (cellphones/bottles) → can be modeled as an Array (index-based).`
        );
        return;
      }

      // Default: no strong DSA pattern
      setConcept("");
      setConceptDetail("");
    };

    const draw = (predictions) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      // Match canvas to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw for cell phones
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );

      setArrayCount(phones.length);

      phones.forEach((p, index) => {
        const [x, y, width, height] = p.bbox;

        // bounding box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // label background below object
        const label = `index[${index}]`;
        const labelHeight = 26;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y + height, width, labelHeight);

        // label text
        ctx.fillStyle = "#00ff00";
        ctx.font = "18px Arial";
        ctx.fillText(label, x + 5, y + height + 18);
      });
    };

    const detectLoop = async () => {
      const now = performance.now();
      if (now - lastDetection >= DETECT_INTERVAL) {
        lastDetection = now;

        if (model && videoRef.current) {
          try {
            const predictions = await model.detect(videoRef.current);

            // Debug label list
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
        EduAR – DSA Concept Detection
      </h1>

      <p style={{ textAlign: "center" }}>{status}</p>

      <p style={{ textAlign: "center", marginTop: "6px" }}>
        📱 Cellphones detected as array elements:{" "}
        <strong>{arrayCount}</strong>
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

      {/* Debug info */}
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
