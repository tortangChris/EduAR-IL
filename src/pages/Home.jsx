import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

// ----- Node and Linked List Classes -----
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

class SinglyLinkedList {
  constructor() { this.head = null; }
  append(value) {
    const newNode = new Node(value);
    if (!this.head) { this.head = newNode; return; }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = newNode;
  }
  toArray() {
    const result = [];
    let current = this.head;
    while (current) { result.push(current.value); current = current.next; }
    return result;
  }
  async search(value, callback) {
    let current = this.head;
    while (current) {
      callback(current.value);
      await new Promise((res) => setTimeout(res, 500));
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }
}

class DoublyLinkedList extends SinglyLinkedList {
  append(value) {
    const newNode = new Node(value);
    if (!this.head) { this.head = newNode; return; }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = newNode;
    newNode.prev = current;
  }
}

class CircularLinkedList extends SinglyLinkedList {
  append(value) {
    const newNode = new Node(value);
    if (!this.head) { this.head = newNode; newNode.next = this.head; return; }
    let current = this.head;
    while (current.next !== this.head) current = current.next;
    current.next = newNode;
    newNode.next = this.head;
  }
}

class SkipList extends SinglyLinkedList {} // same logic for simplicity

// ----- 3D Node Component -----
const Node3D = ({ value, position, highlight, label }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={highlight ? "yellow" : "skyblue"} />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.6}
        color={highlight ? "black" : "blue"}
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
      {label && (
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.4}
          color="purple"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// ----- 3D Line Component -----
const Link3D = ({ start, end }) => {
  return (
    <line>
      <bufferGeometry
        attach="geometry"
        positions={new Float32Array([start[0], start[1], start[2], end[0], end[1], end[2]])}
      />
      <lineBasicMaterial attach="material" color="black" />
    </line>
  );
};

// ----- Main Home Component -----
const Home = () => {
  const [listType, setListType] = useState("Singly");
  const [values, setValues] = useState([]);
  const [list, setList] = useState(new SinglyLinkedList());
  const [searchValue, setSearchValue] = useState(null);
  const [highlightValue, setHighlightValue] = useState(null);

  const generateRandomList = (type, length = 5) => {
    let newList;
    switch (type) {
      case "Singly": newList = new SinglyLinkedList(); break;
      case "Doubly": newList = new DoublyLinkedList(); break;
      case "Circular": newList = new CircularLinkedList(); break;
      case "Skip": newList = new SkipList(); break;
      default: newList = new SinglyLinkedList();
    }
    for (let i = 0; i < length; i++) {
      const randomValue = Math.floor(Math.random() * 100) + 1;
      newList.append(randomValue);
    }
    setList(newList);
    setValues(newList.toArray());
    setHighlightValue(null);
  };

  const handleListTypeChange = (type) => {
    setListType(type);
    generateRandomList(type);
  };

  const handleSearch = async () => {
    if (!searchValue) return;
    await list.search(parseInt(searchValue), setHighlightValue);
  };

  // positions nodes in a row
  const nodePositions = values.map((v, i) => [i * 3, 0, 0]);

  return (
    <div className="p-4 font-sans h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">3D Linked List Visualizer</h1>

      {/* Controls */}
      <div className="mb-4 flex space-x-2 items-center">
        <label>Select List Type:</label>
        <select value={listType} onChange={(e) => handleListTypeChange(e.target.value)}>
          {["Singly", "Doubly", "Circular", "Skip"].map((type) => (
            <option key={type} value={type}>{type} List</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Search value"
          value={searchValue || ""}
          onChange={(e) => setSearchValue(e.target.value)}
          className="border rounded px-2"
        />
        <button onClick={handleSearch} className="px-2 py-1 bg-blue-500 text-white rounded">Search</button>
      </div>

      {/* Three.js Canvas */}
      <div className="flex-grow">
        <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <OrbitControls />

          {/* Nodes */}
          {values.map((val, idx) => (
            <Node3D
              key={idx}
              value={val}
              highlight={highlightValue === val}
              label={
                idx === 0 ? `head/${idx}` :
                idx === values.length - 1 ? `tail/${idx}` :
                ""
              }
              position={nodePositions[idx]}
            />
          ))}

          {/* Links */}
          {nodePositions.map((pos, idx) =>
            idx < nodePositions.length - 1 ? (
              <Link3D key={idx} start={pos} end={nodePositions[idx + 1]} />
            ) : listType === "Circular" ? (
              <Link3D key={"circular"} start={pos} end={nodePositions[0]} />
            ) : null
          )}
        </Canvas>
      </div>
    </div>
  );
};

export default Home;
