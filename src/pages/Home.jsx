import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
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
  constructor() {
    this.head = null;
  }
  append(value) {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = newNode;
  }
  toArray() {
    const result = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
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
    if (!this.head) {
      this.head = newNode;
      return;
    }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = newNode;
    newNode.prev = current;
  }
}

class CircularLinkedList extends SinglyLinkedList {
  append(value) {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
      newNode.next = this.head;
      return;
    }
    let current = this.head;
    while (current.next !== this.head) current = current.next;
    current.next = newNode;
    newNode.next = this.head;
  }
}

class SkipList extends SinglyLinkedList {} // simplified

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

// ----- 3D Arrow Component -----
const Arrow3D = ({ start, end, color = "black" }) => {
  const dir = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const length = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  const mid = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  const rotationY = Math.atan2(dir[2], dir[0]);
  const rotationZ = Math.asin(dir[1] / length);

  return (
    <group position={mid} rotation={[0, -rotationY, rotationZ]}>
      {/* Shaft */}
      <mesh position={[length / 2 - 0.3, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, length - 0.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arrowhead */}
      <mesh position={[length / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// ----- Main Home Component -----
const Home = () => {
  const [listType, setListType] = useState("Singly");
  const [values, setValues] = useState([]);
  const [list, setList] = useState(new SinglyLinkedList());
  const [searchValue, setSearchValue] = useState(null);
  const [highlightValue, setHighlightValue] = useState(null);
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );

  // Handle resize for portrait
  useEffect(() => {
    const handleResize = () =>
      setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const generateRandomList = (type, length = 5) => {
    let newList;
    switch (type) {
      case "Singly":
        newList = new SinglyLinkedList();
        break;
      case "Doubly":
        newList = new DoublyLinkedList();
        break;
      case "Circular":
        newList = new CircularLinkedList();
        break;
      case "Skip":
        newList = new SkipList();
        break;
      default:
        newList = new SinglyLinkedList();
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

  // === Portrait check ===
  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  // Node positions
  const nodePositions = values.map((v, i) => [i * 3, 0, 0]);

  return (
    <div className="p-4 font-sans h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">3D Linked List Visualizer</h1>

      {/* Controls */}
      <div className="mb-4 flex space-x-2 items-center">
        <label>Select List Type:</label>
        <select
          value={listType}
          onChange={(e) => handleListTypeChange(e.target.value)}
        >
          {["Singly", "Doubly", "Circular", "Skip"].map((type) => (
            <option key={type} value={type}>
              {type} List
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Search value"
          value={searchValue || ""}
          onChange={(e) => setSearchValue(e.target.value)}
          className="border rounded px-2"
        />
        <button
          onClick={handleSearch}
          className="px-2 py-1 bg-blue-500 text-white rounded"
        >
          Search
        </button>
      </div>

      {/* 3D Canvas */}
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
                idx === 0
                  ? `head/${idx}`
                  : idx === values.length - 1
                  ? `tail/${idx}`
                  : ""
              }
              position={nodePositions[idx]}
            />
          ))}

          {/* Forward arrows */}
          {nodePositions.map((pos, idx) =>
            idx < nodePositions.length - 1 ? (
              <Arrow3D key={idx} start={pos} end={nodePositions[idx + 1]} />
            ) : listType === "Circular" && nodePositions.length > 1 ? (
              <Arrow3D key="circular" start={pos} end={nodePositions[0]} />
            ) : null
          )}

          {/* Backward arrows for Doubly Linked List */}
          {listType === "Doubly" &&
            nodePositions.map((pos, idx) =>
              idx > 0 ? (
                <Arrow3D
                  key={`back-${idx}`}
                  start={pos}
                  end={nodePositions[idx - 1]}
                  color="red"
                />
              ) : null
            )}
        </Canvas>
      </div>
    </div>
  );
};

export default Home;
