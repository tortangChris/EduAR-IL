import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const mindarThree = new MindARThree({
  container: document.body,
  imageTargetSrc: "/mindar/targets.mind",
});

const { renderer, scene, camera } = mindarThree;

// 🔹 Light
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
scene.add(light);

// 🔹 Anchor (image target index 0)
const anchor = mindarThree.addAnchor(0);

// 🔹 Cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
cube.position.set(-0.4, 0, 0);

// 🔹 Sphere
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
sphere.position.set(0, 0, 0);

// 🔹 Cone
const cone = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 0.4, 32),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);
cone.position.set(0.4, 0, 0);

// 🔹 Add to anchor
anchor.group.add(cube);
anchor.group.add(sphere);
anchor.group.add(cone);

// 🔹 Animation loop
await mindarThree.start();

renderer.setAnimationLoop(() => {
  cube.rotation.y += 0.01;
  sphere.rotation.y += 0.01;
  cone.rotation.y += 0.01;

  renderer.render(scene, camera);
});
