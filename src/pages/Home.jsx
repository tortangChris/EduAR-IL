import React, { useState, useEffect } from "react";

const Home = () => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [active, setActive] = useState([-1, -1]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isPortrait, setIsPortrait] = useState(false);

  // Detect orientation
  const checkOrientation = () => {
    setIsPortrait(window.innerHeight > window.innerWidth);
  };

  useEffect(() => {
    generateArray();
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const generateArray = () => {
    let temp = [];
    for (let i = 0; i < 10; i++) {
      temp.push(Math.floor(Math.random() * 90) + 10);
    }
    setArray(temp);
    setSortedIndices([]);
    setActive([-1, -1]);
  };

  const bubbleSort = async () => {
    setSorting(true);
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setActive([j, j + 1]);
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      setSortedIndices((prev) => [...prev, n - i - 1]);
    }
    setSortedIndices((prev) => [...prev, 0]);
    setActive([-1, -1]);
    setSorting(false);
  };

  const selectionSort = async () => {
    setSorting(true);
    let arr = [...array];
    let n = arr.length;

    for (let i = 0; i < n; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        setActive([minIdx, j]);
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setActive([i, minIdx]);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      setArray([...arr]);
      setSortedIndices((prev) => [...prev, i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setActive([-1, -1]);
    setSorting(false);
  };

  const insertionSort = async () => {
    setSorting(true);
    let arr = [...array];
    let n = arr.length;

    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        setActive([j, j + 1]);
        await new Promise((resolve) => setTimeout(resolve, 800));

        arr[j + 1] = arr[j];
        setArray([...arr]);
        j--;
      }
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices([...Array(i + 1).keys()]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setActive([-1, -1]);
    setSorting(false);
  };

  if (isPortrait) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "24px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Sorting Algorithms Visualization</h1>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "10px",
          height: "300px",
          marginBottom: "20px",
        }}
      >
        {array.map((value, index) => {
          let color = "teal";
          if (sortedIndices.includes(index)) color = "green";
          else if (active.includes(index)) color = "orange";

          return (
            <div key={index} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "30px",
                  height: `${value * 2}px`,
                  background: color,
                  margin: "0 auto",
                  transition: "0.5s",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    top: "-20px",
                    fontSize: "12px",
                    color: "white",
                  }}
                >
                  {value}
                </span>
              </div>
              <div style={{ marginTop: "5px", fontSize: "12px" }}>{index}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
        <button
          onClick={generateArray}
          disabled={sorting}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Generate New Array
        </button>

        <button
          onClick={bubbleSort}
          disabled={sorting}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Bubble Sort
        </button>

        <button
          onClick={selectionSort}
          disabled={sorting}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Selection Sort
        </button>

        <button
          onClick={insertionSort}
          disabled={sorting}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Insertion Sort
        </button>
      </div>
    </div>
  );
};

export default Home;
