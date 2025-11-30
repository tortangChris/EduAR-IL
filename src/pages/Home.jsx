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

  // 🔹 Capture state
  const [capturedNodes, setCapturedNodes] = useState([]); // {id, src, label}
  const lastCupBBoxRef = useRef(null); // { x, y, w, h } for last node
  const lastCupsRef = useRef([]); // bounding boxes for ALL nodes (sequence)

  // 🔹 "AR" placed nodes (stickers on video)
  const [placedNodes, setPlacedNodes] = useState([]); // {id, src, x, y, label}
  const arAreaRef = useRef(null); // wrapper ng video+canvas

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

      if (cups.length === 0) {
        lastCupBBoxRef.current = null;
        lastCupsRef.current = [];
        return;
      }

      const cupsSorted = [...cups].sort(
        (a, b) => a.bbox[0] - b.bbox[0]
      );

      // Save ALL bounding boxes (for sequential capture)
      lastCupsRef.current = cupsSorted.map((p, index) => ({
        x: p.bbox[0],
        y: p.bbox[1],
        w: p.bbox[2],
        h: p.bbox[3],
        label: `node[${index}]`,
      }));

      // Save last (rightmost) cup for "Capture last node"
      const lastCup = cupsSorted[cupsSorted.length - 1];
      const [lx, ly, lw, lh] = lastCup.bbox;
      lastCupBBoxRef.current = { x: lx, y: ly, w: lw, h: lh };

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

  // 🔹 Capture LAST node (rightmost cup)
  const handleCaptureLastNode = () => {
    const video = videoRef.current;
    const bbox = lastCupBBoxRef.current;

    if (!video || !bbox) {
      alert("Walang cup na pwedeng i-capture ngayon 😅");
      return;
    }

    const { x, y, w, h } = bbox;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(
      video,
      x, y, w, h, // source
      0, 0, w, h  // dest
    );

    const dataUrl = canvas.toDataURL("image/png");

    setCapturedNodes((prev) => [
      ...prev,
      { id: Date.now(), src: dataUrl, label: `last-node` },
    ]);
  };

  // 🔹 Capture SEQUENCE: node[0]…node[n-1] in order
  const handleCaptureSequence = () => {
    const video = videoRef.current;
    const cups = lastCupsRef.current;

    if (!video || !cups || cups.length === 0) {
      alert("Walang linked list cups na pwedeng i-capture ngayon 😅");
      return;
    }

    const newNodes = cups.map((c, idx) => {
      const { x, y, w, h, label } = c;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(
        video,
        x, y, w, h,  // source
        0, 0, w, h   // dest
      );

      const dataUrl = canvas.toDataURL("image/png");

      return {
        id: Date.now() + idx,
        src: dataUrl,
        label: label ?? `node[${idx}]`,
      };
    });

    setCapturedNodes((prev) => [...prev, ...newNodes]);
  };

  const handleClearCaptured = () => {
    setCapturedNodes([]);
    setPlacedNodes([]);
  };

  // 🔹 Drag & Drop handlers (captured → AR area)
  const handleDragStart = (e, node) => {
    // send node id via DataTransfer
    e.dataTransfer.setData("text/plain", node.id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // para gumana ang onDrop
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    if (!idStr) return;

    const id = Number(idStr);
    const node = capturedNodes.find((n) => n.id === id);
    if (!node || !arAreaRef.current) return;

    const rect = arAreaRef.current.getBoundingClientRect();
    const imgSize = 80; // px, AR sticker size

    const x = e.clientX - rect.left - imgSize / 2;
    const y = e.clientY - rect.top - imgSize / 2;

    setPlacedNodes((prev) => [
      ...prev,
      {
        ...node,
        x,
        y,
      },
    ]);
  };

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

      {/* Video + Canvas + AR overlay (drop area) */}
      <div
        ref={arAreaRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          borderRadius: "10px",
          overflow: "hidden",
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
            display: "block",
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

        {/* AR placed nodes (over the camera) */}
        {placedNodes.map((node) => (
          <img
            key={`placed-${node.id}-${node.x}-${node.y}`}
            src={node.src}
            alt={node.label}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "2px solid #facc15",
              boxShadow: "0 0 10px rgba(0,0,0,0.7)",
            }}
          />
        ))}
      </div>

      {/* Capture buttons */}
      <div
        style={{
          maxWidth: "480px",
          margin: "8px auto",
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleCaptureLastNode}
          style={{
            padding: "8px 12px",
            background: "#22c55e",
            border: "none",
            borderRadius: "6px",
            color: "#0f172a",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📸 Capture last node
        </button>

        <button
          onClick={handleCaptureSequence}
          style={{
            padding: "8px 12px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "6px",
            color: "#f9fafb",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📸 Capture sequence (node[0..n-1])
        </button>

        {capturedNodes.length > 0 && (
          <button
            onClick={handleClearCaptured}
            style={{
              padding: "8px 12px",
              background: "#ef4444",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            🗑 Clear captured & AR
          </button>
        )}
      </div>

      {/* Captured nodes list (draggable → AR area) */}
      {capturedNodes.length > 0 && (
        <div
          style={{
            maxWidth: "480px",
            margin: "12px auto",
            background: "#111827",
            borderRadius: "8px",
            padding: "8px",
            border: "1px solid #4B5563",
          }}
        >
          <p style={{ marginBottom: "6px" }}>
            📦 Captured linked list node snapshots (drag to camera area to place as AR):
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {capturedNodes.map((node, idx) => (
              <div
                key={node.id}
                style={{
                  width: "100px",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  cursor: "grab",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    overflow: "hidden",
                    borderRadius: "8px",
                    border: "1px solid #4B5563",
                    marginBottom: "4px",
                  }}
                >
                  <img
                    src={node.src}
                    alt={node.label ?? `Captured node ${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <span>{node.label ?? `node[${idx}]`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
