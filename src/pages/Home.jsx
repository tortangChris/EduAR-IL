import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

/**
 * Detect vertical book spines using OpenCV edges from the current video frame.
 * Returns an array of stacks, each stack = array of vertical lines sorted top→bottom.
 * Each line: { x1, y1, x2, y2, x, yTop, yBottom }
 *
 * Unlimited stacks:
 * - Sort lines by x
 * - Group lines into stacks if malapit ang x (within threshold)
 */
const detectBookStacksFromEdges = (videoEl) => {
  if (!window.cv || !videoEl.videoWidth || !videoEl.videoHeight) return [];

  const cv = window.cv;

  // 1. Capture current frame to an offscreen canvas
  const capCanvas = document.createElement("canvas");
  capCanvas.width = videoEl.videoWidth;
  capCanvas.height = videoEl.videoHeight;
  const capCtx = capCanvas.getContext("2d");
  capCtx.drawImage(videoEl, 0, 0, capCanvas.width, capCanvas.height);

  const frame = cv.imread(capCanvas);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const lines = new cv.Mat();

  try {
    // 2. Grayscale + blur + edges
    cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0);
    cv.Canny(blur, edges, 50, 150); // thresholds pwede i-tune

    // 3. HoughLinesP to find vertical-ish lines (book spines)
    cv.HoughLinesP(
      edges,
      lines,
      1,
      Math.PI / 180,
      80, // threshold
      50, // minLineLength
      10  // maxLineGap
    );

    const verticalLines = [];

    // Access lines via data32S
    for (let i = 0; i < lines.rows; i++) {
      const x1 = lines.data32S[i * 4 + 0];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);

      // Vertical-ish line (spine): maliit ang dx, mahaba ang dy
      if (dx < 15 && dy > 40) {
        const cx = (x1 + x2) / 2;
        const yTop = Math.min(y1, y2);
        const yBottom = Math.max(y1, y2);
        verticalLines.push({ x1, y1, x2, y2, x: cx, yTop, yBottom });
      }
    }

    if (verticalLines.length < 2) {
      return [];
    }

    // 4. Sort by x, then group into stacks by proximity
    verticalLines.sort((a, b) => a.x - b.x);

    const stacks = [];
    const distanceThreshold = 40; // px; adjust kung kailangan mas tight/loose

    verticalLines.forEach((line) => {
      if (stacks.length === 0) {
        stacks.push([line]);
        return;
      }

      const lastStack = stacks[stacks.length - 1];
      const lastLine = lastStack[lastStack.length - 1];

      if (Math.abs(line.x - lastLine.x) <= distanceThreshold) {
        // Same stack
        lastStack.push(line);
      } else {
        // New stack
        stacks.push([line]);
      }
    });

    // 5. Sort lines inside each stack by top y (para top→bottom)
    stacks.forEach((stack) => {
      stack.sort((a, b) => a.yTop - b.yTop);
    });

    return stacks; // Unlimited stacks, depende sa arrangement
  } catch (e) {
    console.error("OpenCV stack detection error:", e);
    return [];
  } finally {
    frame.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    lines.delete();
  }
};

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

    const analyzeScene = (predictions, stacks) => {
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

      // --- Stack rule (books using OpenCV vertical edges/spines) ---
      if (books.length >= 1 && stacks && stacks.length >= 1) {
        const stackCount = stacks.length;
        setConcept("Stack (LIFO)");
        setConceptDetail(
          `Detected ${stackCount} book stack(s) via vertical edges (spines) → behaves like a Stack (Last In, First Out).`
        );
        return;
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

    const draw = (predictions, stacks) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      // Match canvas to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ----- Draw cell phones as array elements -----
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

      // ----- Draw book stacks from OpenCV edges -----
      if (stacks && stacks.length > 0) {
        const stackColors = ["#f97316", "#3b82f6", "#ec4899", "#22c55e"]; // orange, blue, pink, green

        stacks.forEach((stack, sIdx) => {
          const color = stackColors[sIdx % stackColors.length];

          // Draw each vertical line (book spine) in this stack
          stack.forEach((line) => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
          });

          // Draw a label at the top of the stack (average x)
          const avgX =
            stack.reduce((sum, l) => sum + l.x, 0) / Math.max(stack.length, 1);
          const topY = Math.min(...stack.map((l) => l.yTop));

          ctx.fillStyle = color;
          ctx.font = "16px Arial";
          ctx.fillText(
            `Stack ${sIdx + 1}`,
            avgX - 30,
            Math.max(20, topY - 10)
          );
        });
      }
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

            // Use OpenCV stacks only if cv is loaded
            let stacks = [];
            const hasBooks = predictions.some(
              (p) => p.class === "book" && p.score > 0.4
            );
            if (hasBooks && window.cv) {
              stacks = detectBookStacksFromEdges(videoRef.current);
            }

            draw(predictions, stacks);
            analyzeScene(predictions, stacks);
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
