import React, { useEffect, useRef } from "react";
import "./css/common.css";

// Import scripts gaya ng dati
import { WebXRButton } from "./js/util/webxr-button.js";
import { Scene } from "./js/render/scenes/scene.js";
import { Renderer, createWebGLContext } from "./js/render/core/renderer.js";
import { Node } from "./js/render/core/node.js";
import { Gltf2Node } from "./js/render/nodes/gltf2.js";
import { BoxBuilder } from "./js/render/geometry/box-builder.js";
import { PbrMaterial } from "./js/render/materials/pbr.js";
import { vec3, mat4 } from "./js/render/math/gl-matrix.js";
import { InlineViewerHelper } from "./js/util/inline-viewer-helper.js";
import { QueryArgs } from "./js/util/query-args.js";
import { Ray } from "./js/render/math/ray.js";
import WebXRPolyfill from "./js/third-party/webxr-polyfill/build/webxr-polyfill.module.js";

const Home = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // XR globals.
    let xrButton = null;
    let xrImmersiveRefSpace = null;
    let inlineViewerHelper = null;

    // WebGL scene globals.
    let gl = null;
    let renderer = null;
    let scene = new Scene();
    scene.addNode(
      new Gltf2Node({ url: "media/gltf/cube-room/cube-room.gltf" })
    );
    scene.standingStats(true);

    let boxes = [];
    let currently_selected_boxes = [null, null];
    let currently_grabbed_boxes = [null, null];

    // Polyfill
    if (QueryArgs.getBool("usePolyfill", true)) {
      new WebXRPolyfill();
    }

    function initXR() {
      xrButton = new WebXRButton({
        onRequestSession,
        onEndSession,
      });
      document.querySelector("header").appendChild(xrButton.domElement);

      if (navigator.xr) {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
          xrButton.enabled = supported;
        });

        navigator.xr.requestSession("inline").then(onSessionStarted);
      }
    }

    function initGL() {
      if (gl) return;

      gl = createWebGLContext({
        xrCompatible: true,
      });
      canvasRef.current.appendChild(gl.canvas);

      function onResize() {
        gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
        gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
      }
      window.addEventListener("resize", onResize);
      onResize();

      renderer = new Renderer(gl);
      scene.setRenderer(renderer);

      // Create several boxes to use for hit testing.
      let boxBuilder = new BoxBuilder();
      boxBuilder.pushCube([0, 0, 0], 0.4);
      let boxPrimitive = boxBuilder.finishPrimitive(renderer);

      function addBox(x, y, z, r, g, b) {
        let boxMaterial = new PbrMaterial();
        boxMaterial.baseColorFactor.value = [r, g, b, 1.0];
        let boxRenderPrimitive = renderer.createRenderPrimitive(
          boxPrimitive,
          boxMaterial
        );
        let boxNode = new Node();
        boxNode.addRenderPrimitive(boxRenderPrimitive);
        boxNode.selectable = true;
        boxes.push({
          node: boxNode,
          renderPrimitive: boxRenderPrimitive,
          position: [x, y, z],
          scale: [1, 1, 1],
        });
        scene.addNode(boxNode);
      }

      addBox(-1.0, 1.6, -1.3, 1.0, 0.0, 0.0);
      addBox(0.0, 1.7, -1.5, 0.0, 1.0, 0.0);
      addBox(1.0, 1.6, -1.3, 0.0, 0.0, 1.0);
    }

    function onRequestSession() {
      return navigator.xr
        .requestSession("immersive-vr", {
          requiredFeatures: ["local-floor"],
        })
        .then((session) => {
          xrButton.setSession(session);
          session.isImmersive = true;
          onSessionStarted(session);
        });
    }

    function onSessionStarted(session) {
      session.addEventListener("end", onSessionEnded);
      session.addEventListener("selectstart", onSelectStart);
      session.addEventListener("selectend", onSelectEnd);
      session.addEventListener("select", onSelect);
      session.addEventListener("squeezestart", onSqueezeStart);
      session.addEventListener("squeezeend", onSqueezeEnd);
      session.addEventListener("squeeze", onSqueeze);

      initGL();
      scene.inputRenderer.useProfileControllerMeshes(session);

      let glLayer = new XRWebGLLayer(session, gl);
      session.updateRenderState({ baseLayer: glLayer });

      let refSpaceType = session.isImmersive ? "local-floor" : "viewer";
      session.requestReferenceSpace(refSpaceType).then((refSpace) => {
        if (session.isImmersive) {
          xrImmersiveRefSpace = refSpace;
        } else {
          inlineViewerHelper = new InlineViewerHelper(gl.canvas, refSpace);
          inlineViewerHelper.setHeight(1.6);
        }
        session.requestAnimationFrame(onXRFrame);
      });
    }

    function onSelectStart(ev) {
      let refSpace = ev.frame.session.isImmersive
        ? xrImmersiveRefSpace
        : inlineViewerHelper.referenceSpace;
      let targetRayPose = ev.frame.getPose(
        ev.inputSource.targetRaySpace,
        refSpace
      );
      if (!targetRayPose) return;

      let hitResult = scene.hitTest(targetRayPose.transform);
      if (hitResult) {
        for (let box of boxes) {
          if (hitResult.node === box.node) {
            let i = ev.inputSource.handedness === "left" ? 0 : 1;
            currently_selected_boxes[i] = box;
            box.scale = [1.25, 1.25, 1.25];
            box.selected = false;
          }
        }
      }
    }

    function onSelectEnd(ev) {
      let i = ev.inputSource.handedness === "left" ? 0 : 1;
      let currently_selected_box = currently_selected_boxes[i];
      if (currently_selected_box) {
        if (currently_selected_box.selected) {
          vec3.add(
            currently_selected_box.scale,
            currently_selected_box.scale,
            [0.25, 0.25, 0.25]
          );
          currently_selected_box.selected = false;
        } else {
          currently_selected_box.scale = [0.75, 0.75, 0.75];
        }
        currently_selected_boxes[i] = null;
      }
    }

    function onSelect(ev) {
      let i = ev.inputSource.handedness === "left" ? 0 : 1;
      let currently_selected_box = currently_selected_boxes[i];
      if (currently_selected_box) {
        let uniforms = currently_selected_box.renderPrimitive.uniforms;
        uniforms.baseColorFactor.value = [
          Math.random(),
          Math.random(),
          Math.random(),
          1.0,
        ];
        vec3.add(
          currently_selected_box.scale,
          currently_selected_box.scale,
          [-0.5, -0.5, -0.5]
        );
        currently_selected_box.selected = true;
      }
    }

    function onSqueezeStart(ev) {
      let refSpace = ev.frame.session.isImmersive
        ? xrImmersiveRefSpace
        : inlineViewerHelper.referenceSpace;
      let targetRayPose = ev.frame.getPose(
        ev.inputSource.targetRaySpace,
        refSpace
      );
      if (!targetRayPose) return;

      let hitResult = scene.hitTest(targetRayPose.transform);
      if (hitResult) {
        for (let box of boxes) {
          if (hitResult.node === box.node && !box.grabbed) {
            let i = ev.inputSource.handedness === "left" ? 0 : 1;
            currently_grabbed_boxes[i] = box;
            box.scale = [0.1, 0.1, 0.1];
            box.originalPos = box.position;
            box.grabbed = true;
          }
        }
      }
    }

    function onSqueezeEnd(ev) {
      let i = ev.inputSource.handedness === "left" ? 0 : 1;
      let currently_grabbed_box = currently_grabbed_boxes[i];
      if (currently_grabbed_box && currently_grabbed_box.grabbed) {
        vec3.add(
          currently_grabbed_box.scale,
          currently_grabbed_box.scale,
          [1, 1, 1]
        );
        currently_grabbed_box.position = currently_grabbed_box.originalPos;
        currently_grabbed_box.grabbed = false;
        currently_grabbed_boxes[i] = null;
      }
    }

    function onSqueeze(ev) {
      let i = ev.inputSource.handedness === "left" ? 0 : 1;
      let currently_grabbed_box = currently_grabbed_boxes[i];
      if (currently_grabbed_box && currently_grabbed_box.grabbed) {
        let uniforms = currently_grabbed_box.renderPrimitive.uniforms;
        uniforms.baseColorFactor.value = [
          Math.random(),
          Math.random(),
          Math.random(),
          1.0,
        ];
      }
    }

    function onEndSession(session) {
      session.end();
    }

    function onSessionEnded(event) {
      if (event.session.isImmersive) {
        xrButton.setSession(null);
      }
    }

    function onXRFrame(time, frame) {
      let session = frame.session;
      let refSpace = session.isImmersive
        ? xrImmersiveRefSpace
        : inlineViewerHelper.referenceSpace;
      let pose = frame.getViewerPose(refSpace);

      scene.startFrame();
      session.requestAnimationFrame(onXRFrame);

      for (let inputSource of frame.session.inputSources) {
        let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);
        if (!targetRayPose) continue;

        let i = inputSource.handedness === "left" ? 0 : 1;
        if (currently_grabbed_boxes[i] && currently_grabbed_boxes[i].grabbed) {
          let targetRay = new Ray(targetRayPose.transform.matrix);
          let grabDistance = 0.1;
          let grabPos = vec3.fromValues(
            targetRay.origin[0],
            targetRay.origin[1],
            targetRay.origin[2]
          );
          vec3.add(grabPos, grabPos, [
            targetRay.direction[0] * grabDistance,
            targetRay.direction[1] * grabDistance + 0.06,
            targetRay.direction[2] * grabDistance,
          ]);
          currently_grabbed_boxes[i].position = grabPos;
        }
      }

      for (let box of boxes) {
        let node = box.node;
        mat4.identity(node.matrix);
        mat4.translate(node.matrix, node.matrix, box.position);
        mat4.rotateX(node.matrix, node.matrix, time / 1000);
        mat4.rotateY(node.matrix, node.matrix, time / 1500);
        mat4.scale(node.matrix, node.matrix, box.scale);
      }

      scene.updateInputSources(frame, refSpace);
      scene.drawXRFrame(frame, pose);
      scene.endFrame();
    }

    initXR();
  }, []);

  return (
    <div>
      <header>
        <details open>
          <summary>Input Selection</summary>
          <p>
            This sample demonstrates handling 'select' events generated by
            XRInputSources to create clickable objects in the scene.
            <a className="back" href="./">
              Back
            </a>
          </p>
        </details>
      </header>
      <div ref={canvasRef}></div>
    </div>
  );
};

export default Home;
