import React, { useState, useEffect } from "react";

// ----- Node and Linked List Classes -----
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.prev = null; // for doubly linked list
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
}

class CircularLinkedList {
  constructor() {
    this.head = null;
  }

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

  toArray() {
    const result = [];
    if (!this.head) return result;
    let current = this.head;
    do {
      result.push(current.value);
      current = current.next;
    } while (current !== this.head);
    return result;
  }
}

class DoublyLinkedList {
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
    newNode.prev = current;
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
}

class SkipList {
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
}

// ----- React Component -----
const Home = () => {
  const [listType, setListType] = useState("Singly"); // default
  const [values, setValues] = useState([]);
  const [list, setList] = useState(new SinglyLinkedList());
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );

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
      case "Circular":
        newList = new CircularLinkedList();
        break;
      case "Doubly":
        newList = new DoublyLinkedList();
        break;
      case "Skip":
        newList = new SkipList();
        break;
      default:
        newList = new SinglyLinkedList();
    }

    for (let i = 0; i < length; i++) {
      const randomValue = Math.floor(Math.random() * 100);
      newList.append(randomValue);
    }

    setList(newList);
    setValues(newList.toArray());
  };

  const handleListTypeChange = (type) => {
    setListType(type);
    generateRandomList(type);
  };

  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Linked List Visualizer</h1>

      {/* List Type Buttons */}
      <div className="flex space-x-4 mb-6">
        {["Singly", "Circular", "Doubly", "Skip"].map((type) => (
          <button
            key={type}
            onClick={() => handleListTypeChange(type)}
            className={`px-4 py-2 rounded ${
              listType === type
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition`}
          >
            {type} List
          </button>
        ))}
      </div>

      {/* Visualization */}
      {values.length === 0 ? (
        <p className="text-gray-500">Linked list is empty</p>
      ) : (
        <div className="flex items-center space-x-4 overflow-x-auto py-4">
          {values.map((val, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-100 border-2 border-blue-400 rounded-full text-lg font-semibold text-blue-700">
                  {val}
                </div>
                <div className="mt-1 text-sm font-bold text-blue-600">
                  {idx === 0
                    ? `head/${idx}`
                    : idx === values.length - 1
                    ? `tail/${idx}`
                    : ""}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {listType === "Circular" && idx === values.length - 1
                  ? "→ head"
                  : idx === values.length - 1
                  ? "→ null"
                  : "→"}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
