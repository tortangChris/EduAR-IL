import React, { useState, useEffect } from "react";

class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
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
    while (current.next) {
      current = current.next;
    }
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

const Home = () => {
  const [list] = useState(new LinkedList());
  const [input, setInput] = useState("");
  const [values, setValues] = useState([]);
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );

  // Detect orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAdd = () => {
    if (input !== "") {
      list.append(input);
      setValues(list.toArray());
      setInput("");
    }
  };

  // Show rotate message if in portrait
  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  // Landscape mode: show visualizer
  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Linked List Visualization</h1>

      <div className="flex items-center mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter value"
          className="border border-gray-400 rounded px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Add Node
        </button>
      </div>

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
              </div>
              <div className="text-2xl font-bold">
                {idx === values.length - 1 ? "→ null" : "→"}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
