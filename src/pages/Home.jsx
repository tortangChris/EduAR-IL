// Home.jsx
import React, { useEffect, useRef, useState } from "react";

// This component injects A-Frame and registers a small set of components:
// - ar-hit-test: performs WebXR hit-test and updates a reticle entity
// - aframe-interact: lets user tap to select (glow) and drag using the reticle
// It also exposes simple UI for inserting/deleting array values.

export default function Home() {
  const sceneRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [arr, setArr] = useState([10, 20, 30, 40]);
  const idxRef = useRef(0);
  const valRef = useRef(77);

  useEffect(() => {
    // Inject A-Frame if not present
    if (!window.AFRAME) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/aframe@1.4.2/dist/aframe.min.js";
      s.onload = () => registerComponents();
      document.head.appendChild(s);
    } else {
      registerComponents();
    }

    function registerComponents() {
      const AFRAME = window.AFRAME;
      if (!AFRAME) return;

      // Prevent double-registration
      if (!AFRAME.components["ar-hit-test"]) {
        AFRAME.registerComponent("ar-hit-test", {
          schema: { enabled: { default: true } },
          init() {
            this.reticleEl = document.createElement("a-entity");
            this.reticleEl.setAttribute("geometry", {
              primitive: "ring",
              radiusInner: 0.06,
              radiusOuter: 0.08,
            });
            this.reticleEl.setAttribute("rotation", "-90 0 0");
            this.reticleEl.setAttribute("visible", false);
            this.reticleEl.setAttribute("material", {
              shader: "flat",
              opacity: 0.9,
            });
            this.el.sceneEl.appendChild(this.reticleEl);

            this.hitTestSource = null;
            this.viewerSpace = null;
            this.onSessionStart = this.onSessionStart.bind(this);
            this.onSessionEnd = this.onSessionEnd.bind(this);

            // listen for session start from the scene
            this.el.sceneEl.addEventListener("enter-vr", this.onSessionStart);
            this.el.sceneEl.addEventListener("exit-vr", this.onSessionEnd);

            // a simple placed flag
            this.placed = false;

            // reference to the group to place (an entity with id 'arrayGroup')
            this.arrayGroup = document.getElementById("arrayGroup");

            // tap to place
            this.onSelect = (evt) => {
              if (!this.placed && this.reticleEl.getAttribute("visible")) {
                // move arrayGroup to reticle
                const p = this.reticleEl.object3D.position;
                const q = this.reticleEl.object3D.quaternion;
                if (this.arrayGroup) {
                  this.arrayGroup.object3D.position.copy(p);
                  this.arrayGroup.object3D.quaternion.copy(q);
                  this.placed = true;
                }
              }
            };
          },

          onSessionStart() {
            const scene = this.el.sceneEl;
            // only proceed if an AR session is active
            const xr = scene.renderer && scene.renderer.xr;
            if (!xr) return;

            const session = xr.getSession && xr.getSession();
            if (!session) return;

            // request viewer ref space and hit test source
            session
              .requestReferenceSpace("viewer")
              .then((refSpace) => {
                this.viewerSpace = refSpace;
                session
                  .requestHitTestSource({ space: refSpace })
                  .then((source) => {
                    this.hitTestSource = source;
                  })
                  .catch(() => {
                    console.warn("hit test source request failed");
                  });
              })
              .catch(() => {});

            // listen for select (tap) events from XR input
            session.addEventListener("select", this.onSelect);
            this.session = session;
          },

          onSessionEnd() {
            if (this.session) {
              this.session.removeEventListener("select", this.onSelect);
            }
            this.hitTestSource = null;
            this.viewerSpace = null;
            this.reticleEl.setAttribute("visible", false);
            this.placed = false;
          },

          tick(time, deltaTime, frame) {
            // frame is XRFrame when in AR VR mode
            if (!frame) return;
            const session = frame.session;
            if (!this.hitTestSource) return;

            const referenceSpace =
              this.el.sceneEl.renderer.xr.getReferenceSpace();
            if (!referenceSpace) return;

            const hitTestResults = frame.getHitTestResults(this.hitTestSource);
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              if (pose) {
                const p = pose.transform.position;
                const o = pose.transform.orientation;
                this.reticleEl.object3D.position.set(p.x, p.y, p.z);
                this.reticleEl.object3D.quaternion.set(o.x, o.y, o.z, o.w);
                this.reticleEl.setAttribute("visible", true);
              }
            } else {
              this.reticleEl.setAttribute("visible", false);
            }
          },

          remove() {
            this.el.sceneEl.removeEventListener(
              "enter-vr",
              this.onSessionStart
            );
            this.el.sceneEl.removeEventListener("exit-vr", this.onSessionEnd);
            if (this.reticleEl && this.reticleEl.parentNode)
              this.reticleEl.parentNode.removeChild(this.reticleEl);
          },
        });
      }

      if (!AFRAME.components["aframe-interact"]) {
        AFRAME.registerComponent("aframe-interact", {
          init() {
            // Make contained box children interactive (tap to glow, drag via reticle)
            this.selected = null;
            this.dragging = false;
            this.reticle = null;
            // try to find reticle created by ar-hit-test
            this.el.sceneEl.addEventListener("loaded", () => {
              // reticle is appended as a child of scene by ar-hit-test
              // we look for a ring geometry entity
              const ents = this.el.sceneEl.querySelectorAll("a-entity");
              for (let i = 0; i < ents.length; i++) {
                const ent = ents[i];
                if (
                  ent.getAttribute("geometry") &&
                  ent.getAttribute("geometry").primitive === "ring"
                ) {
                  this.reticle = ent;
                  break;
                }
              }
            });

            // pointer handlers for non-XR (desktop) interactions
            this.onPointerDown = this.onPointerDown.bind(this);
            this.onPointerMove = this.onPointerMove.bind(this);
            this.onPointerUp = this.onPointerUp.bind(this);

            this.el.sceneEl.canvas &&
              this.el.sceneEl.canvas.addEventListener(
                "pointerdown",
                this.onPointerDown
              );
            window.addEventListener("pointermove", this.onPointerMove);
            window.addEventListener("pointerup", this.onPointerUp);

            // Handle touch/select events coming from XR session (via scene enter-vr select)
            this.onSelect = (evt) => {
              // perform a simple proximity test against the children using world positions
              if (!this.reticle) return;
              const visible = this.reticle.getAttribute("visible");
              if (!visible) return;
              // select nearest child to reticle
              const children = this.el.querySelectorAll(".array-box");
              let closest = null;
              let minDist = Infinity;
              children.forEach((c) => {
                const worldPos = new THREE.Vector3();
                c.object3D.getWorldPosition(worldPos);
                const d = worldPos.distanceTo(this.reticle.object3D.position);
                if (d < minDist) {
                  minDist = d;
                  closest = c;
                }
              });
              if (closest && minDist < 0.25) {
                this.selectEntity(closest);
              } else {
                // if arrayGroup not placed, place it
                const sceneComp = this.el.components["ar-hit-test"];
                if (sceneComp && !sceneComp.placed) {
                  // place handled in ar-hit-test select handler already
                }
              }
            };

            const scene = this.el.sceneEl;
            if (scene && scene.renderer && scene.renderer.xr) {
              const session =
                scene.renderer.xr.getSession && scene.renderer.xr.getSession();
              if (session) session.addEventListener("select", this.onSelect);
            }
          },

          selectEntity(el) {
            // glow effect: increase emissive or change material
            this.deselectCurrent();
            this.selected = el;
            el.setAttribute("material", "emissive", "#22ff22");
            el.setAttribute("material", "emissiveIntensity", 0.6);

            // If index 1 (as number) fire an assessment console message
            const idx = el.getAttribute("data-index");
            if (idx !== null && idx !== undefined && parseInt(idx) === 1) {
              console.log("Assessment: index 1 selected — trigger action");
            }
          },

          deselectCurrent() {
            if (this.selected) {
              // restore
              this.selected.setAttribute("material", "emissive", "#000000");
              this.selected.setAttribute("material", "emissiveIntensity", 0);
              this.selected = null;
            }
          },

          onPointerDown(evt) {
            // raycast using three (sceneEl.object3D)
            const scene = this.el.sceneEl;
            if (!scene) return;
            const canvas = scene.canvas || scene.renderer.domElement;
            const rect = canvas.getBoundingClientRect();
            const x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

            const camera = scene.camera;
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

            // get array-box elements' meshes
            const boxes = this.el.querySelectorAll(".array-box");
            const objects = [];
            boxes.forEach((b) => objects.push(b.object3D));

            const intersects = raycaster.intersectObjects(objects, true);
            if (intersects.length) {
              // find the DOM entity corresponding to the intersected object
              let obj = intersects[0].object;
              while (obj && !obj.el) obj = obj.parent;
              if (obj && obj.el) {
                this.selectEntity(obj.el);
                this.dragging = true;
              }
            }
          },

          onPointerMove(evt) {
            if (!this.dragging || !this.selected) return;
            // if reticle visible use its position as a target
            if (this.reticle && this.reticle.getAttribute("visible")) {
              const p = this.reticle.object3D.position;
              // move selected relative to arrayGroup
              // convert world pos to local of arrayGroup
              const arrayGroup = document.getElementById("arrayGroup");
              if (arrayGroup) {
                const worldPos = p.clone();
                arrayGroup.object3D.worldToLocal(worldPos);
                // keep box on ground (y = box half height)
                worldPos.y = 0.06;
                this.selected.object3D.position.copy(worldPos);
              }
            }
          },

          onPointerUp() {
            this.dragging = false;
          },

          remove() {
            this.el.sceneEl.canvas &&
              this.el.sceneEl.canvas.removeEventListener(
                "pointerdown",
                this.onPointerDown
              );
            window.removeEventListener("pointermove", this.onPointerMove);
            window.removeEventListener("pointerup", this.onPointerUp);
          },
        });
      }

      setLoaded(true);
    }

    return () => {
      // Cleanup if necessary
    };
  }, []);

  // Helpers to rebuild the A-Frame boxes when arr changes
  useEffect(() => {
    if (!loaded) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const group = document.getElementById("arrayGroup");
    if (!group) return;

    // clear children
    while (group.firstChild) group.removeChild(group.firstChild);

    const boxSize = 0.12;
    const spacing = 0.02;
    const total = arr.length;
    const width = total * (boxSize + spacing) - spacing;
    const startX = -width / 2 + boxSize / 2;

    for (let i = 0; i < total; i++) {
      const x = startX + i * (boxSize + spacing);
      const box = document.createElement("a-box");
      box.setAttribute("class", "array-box");
      box.setAttribute("depth", boxSize);
      box.setAttribute("height", boxSize);
      box.setAttribute("width", boxSize);
      box.setAttribute("position", `${x} 0.06 0`);
      box.setAttribute(
        "material",
        "color: #66a3ff; metalness: 0.1; roughness: 0.6; emissive: #000000; emissiveIntensity: 0"
      );
      box.setAttribute("data-index", i);

      // label as text
      const text = document.createElement("a-text");
      text.setAttribute("value", String(arr[i]));
      text.setAttribute("align", "center");
      text.setAttribute("position", "0 0 0.07");
      text.setAttribute("side", "double");
      text.setAttribute("scale", "0.3 0.3 0.3");
      box.appendChild(text);

      // small index text on top
      const idx = document.createElement("a-text");
      idx.setAttribute("value", String(i));
      idx.setAttribute("align", "center");
      idx.setAttribute("position", "0 0.08 0");
      idx.setAttribute("scale", "0.18 0.18 0.18");
      box.appendChild(idx);

      group.appendChild(box);
    }

    // ensure the group has the interaction component
    if (!group.hasAttribute("aframe-interact"))
      group.setAttribute("aframe-interact", "");
  }, [arr, loaded]);

  function insertAt() {
    let idx = parseInt(idxRef.current.value || "0", 10);
    const val = valRef.current.value || "0";
    if (isNaN(idx) || idx < 0) idx = 0;
    if (idx > arr.length) idx = arr.length;
    const copy = arr.slice();
    copy.splice(idx, 0, val);
    setArr(copy);
  }

  function deleteAt() {
    let idx = parseInt(idxRef.current.value || "0", 10);
    if (isNaN(idx) || idx < 0 || idx >= arr.length) return;
    const copy = arr.slice();
    copy.splice(idx, 1);
    setArr(copy);
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* UI overlay */}
      <div
        style={{ position: "absolute", left: 12, top: 12, zIndex: 10 }}
        className="panel"
      >
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: 8,
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label>
              Index{" "}
              <input
                ref={idxRef}
                type="number"
                defaultValue={0}
                style={{ width: 64 }}
              />
            </label>
            <label>
              Value{" "}
              <input
                ref={valRef}
                type="text"
                defaultValue={77}
                style={{ width: 64 }}
              />
            </label>
            <button onClick={insertAt}>Insert</button>
            <button onClick={deleteAt}>Delete</button>
          </div>
        </div>
      </div>

      {/* A-Frame scene */}
      <a-scene
        ref={sceneRef}
        vr-mode-ui="enabled: true"
        embedded
        renderer="colorManagement: true; physicallyCorrectLights: true"
        style={{ width: "100%", height: "100%" }}
        ar-hit-test
      >
        {/* camera + cursor for non-AR interaction */}
        <a-entity id="cameraRig">
          <a-entity camera look-controls position="0 1.6 0">
            <a-entity
              cursor="fuse: false; rayOrigin: mouse"
              raycaster="objects: .array-box"
            />
          </a-entity>
        </a-entity>

        {/* ambient + dir light */}
        <a-entity light="type: ambient; intensity: 0.8"></a-entity>
        <a-entity
          light="type: directional; intensity: 0.6"
          position="0 1 0"
        ></a-entity>

        {/* group for the array - placed by AR reticle */}
        <a-entity id="arrayGroup" position="0 0  -0.6" aframe-interact>
          {/* children created dynamically from arr state */}
        </a-entity>

        {/* ground grid for non-AR mode */}
        <a-grid position="0 -0.02 0" width="4" height="4"></a-grid>
      </a-scene>

      <div
        id="hint"
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 8,
        }}
      >
        Hint: On mobile Chrome use the browser's "Enter AR" / VR button in the
        scene. Tap the reticle to place. Tap boxes to select (they glow). Drag
        uses the reticle position.
      </div>
    </div>
  );
}
