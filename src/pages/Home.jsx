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

  async search(value, callback) {
    let current = this.head;
    while (current) {
      callback(current.value);
      await new Promise((res) => setTimeout(res, 500)); // highlight delay
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
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

  async search(value, callback) {
    if (!this.head) return null;
    let current = this.head;
    do {
      callback(current.value);
      await new Promise((res) => setTimeout(res, 500));
      if (current.value === value) return current;
      current = current.next;
    } while (current !== this.head);
    return null;
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

// ----- React Component -----
const Home = () => {
  const [listType, setListType] = useState("Singly");
  const [values, setValues] = useState([]);
  const [list, setList] = useState(new SinglyLinkedList());
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );
  const [searchValue, setSearchValue] = useState(null);
  const [highlightValue, setHighlightValue] = useState(null);

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

      {/* List Type Dropdown */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Select List Type:</label>
        <select
          value={listType}
          onChange={(e) => handleListTypeChange(e.target.value)}
          className="px-4 py-2 rounded border border-gray-300"
        >
          {["Singly", "Circular", "Doubly", "Skip"].map((type) => (
            <option key={type} value={type}>
              {type} List
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center space-x-2">
        <input
          type="number"
          placeholder="Enter value to search"
          value={searchValue || ""}
          onChange={(e) => setSearchValue(e.target.value)}
          className="px-3 py-2 border rounded border-gray-300"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {/* Visualization */}
      {values.length === 0 ? (
        <p className="text-gray-500">Linked list is empty</p>
      ) : (
        <div className="flex items-center overflow-x-auto py-4">
          {values.map((val, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 flex items-center justify-center border-2 rounded text-lg font-semibold ${
                    highlightValue === val
                      ? "bg-yellow-400 border-yellow-600 text-black"
                      : "bg-blue-100 border-blue-400 text-blue-700"
                  }`}
                  style={{ minHeight: "4rem" }}
                >
                  {val}
                </div>

                <div className="mt-1 text-sm font-bold text-blue-600 h-5 flex items-center justify-center">
                  {idx === 0
                    ? `head/${idx}`
                    : idx === values.length - 1
                    ? `tail/${idx}`
                    : ""}
                </div>
              </div>

              <div className="mb-6 text-2xl font-bold flex items-center h-16">
                {listType === "Doubly"
                  ? idx === values.length - 1
                    ? "←→ null"
                    : "←→"
                  : listType === "Circular" && idx === values.length - 1
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
