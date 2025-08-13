import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Home = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // === THREE.JS SETUP ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    // Example array data
    const arrayData = [10, 20, 30, 40, 50];
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = arrayData.map(
      () => new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );

    // Create boxes for each array element
    arrayData.forEach((value, index) => {
      const cube = new THREE.Mesh(boxGeometry, materials[index]);
      cube.position.x = index * 2; // spread cubes horizontally
      scene.add(cube);

      // Add number label
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value, canvas.width / 2, canvas.height / 2 + 16);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(1.5, 1.5, 1.5);
      sprite.position.set(index * 2, 1.5, 0);
      scene.add(sprite);
    });

    camera.position.z = 8;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <h1 className="text-2xl font-bold">📚 Array Data Structure</h1>

      <section>
        <h2 className="text-xl font-semibold">1. Declaring an Array</h2>
        <p>
          In JavaScript, you can declare an array using square brackets{" "}
          <code>[]</code> or the <code>Array</code> constructor.
        </p>
        <pre className="bg-gray-200 p-2 rounded">
          {`let numbers = [1, 2, 3];  
let fruits = new Array("Apple", "Banana", "Cherry");`}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Creating an Array</h2>
        <p>
          You can create an array by listing values inside square brackets,
          separated by commas.
        </p>
        <pre className="bg-gray-200 p-2 rounded">
          {`let colors = ["Red", "Green", "Blue"];`}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          3. Accessing a Value in an Array
        </h2>
        <p>Array elements are accessed using their index (starting from 0).</p>
        <pre className="bg-gray-200 p-2 rounded">
          {`let fruits = ["Apple", "Banana", "Cherry"];  
console.log(fruits[0]); // Apple`}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Looping Through an Array</h2>
        <p>
          There are multiple ways to loop through arrays, like <code>for</code>{" "}
          loops or <code>forEach</code>.
        </p>
        <pre className="bg-gray-200 p-2 rounded">
          {`let numbers = [10, 20, 30];  

// Using for loop
for (let i = 0; i < numbers.length; i++) {
  console.log(numbers[i]);
}

// Using forEach
numbers.forEach(num => console.log(num));`}
        </pre>
      </section>

      <h2 className="text-lg font-bold">3D Array Visualization</h2>
      <div ref={mountRef} style={{ width: "100%", height: "300px" }} />
    </div>
  );
};

export default Home;
