import React from "react";

const IntroToAlgorithmsContent = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(86vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold text-center">
        CS-6202: ALGORITHMS and COMPLEXITY
      </h1>
      <h2 className="text-xl font-semibold">Module 1: Introduction</h2>

      <section>
        <h3 className="font-semibold">Objectives:</h3>
        <ul className="list-disc list-inside">
          <li>Define algorithm</li>
          <li>Identify the criteria of an algorithm</li>
          <li>Differentiate time and space complexity</li>
          <li>Characterize the size of the input of an algorithm</li>
        </ul>
      </section>

      <section>
        <p>
          An algorithm is a finite set of instructions, which if followed,
          accomplishes a particular task. It is not language-specific—we can use
          any language or symbols to represent instructions.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">The criteria of an algorithm:</h3>
        <ul className="list-decimal list-inside">
          <li>
            Input: Zero or more inputs are externally supplied to the algorithm.
          </li>
          <li>Output: At least one output is produced by an algorithm.</li>
          <li>Definiteness: Each instruction is clear and unambiguous.</li>
          <li>
            Finiteness: The algorithm terminates after a finite number of steps.
          </li>
          <li>
            Effectiveness: Each instruction must be very basic and clearly
            understandable.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Analysis of algorithms:</h3>
        <p>
          Algorithm analysis helps estimate the resources needed to solve
          computational tasks. It mainly focuses on the time required
          (performance) and memory used (space).
        </p>
      </section>

      <section>
        <h3 className="font-semibold">Complexities of an Algorithm:</h3>
        <p>Runtime depends on:</p>
        <ul className="list-disc list-inside">
          <li>The hardware used</li>
          <li>The programming language</li>
          <li>The compiler/runtime environment</li>
        </ul>
        <p>
          To compare algorithms fairly, we define a common description:
          complexity. It is expressed as time and space complexity.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">Time Complexity:</h3>
        <p>
          The formula to estimate the total time required to run an algorithm.
          This is independent of implementation or language.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">Space Complexity:</h3>
        <p>
          The formula used to estimate memory space required for successful
          algorithm execution, usually in primary memory.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">Runtime Analysis:</h3>
        <p>
          We try to estimate how many times the main action is performed, based
          on the input size. Examples include:
        </p>
        <ul className="list-disc list-inside">
          <li>Number of comparisons in sorting</li>
          <li>Number of evaluations in optimization</li>
          <li>Number of compatibility checks in graph coloring</li>
        </ul>
        <p>We estimate:</p>
        <ul className="list-disc list-inside">
          <li>
            <strong>Worst Case:</strong> Max number of steps for any input of
            size n
          </li>
          <li>
            <strong>Best Case:</strong> Min number of steps for any input of
            size n
          </li>
          <li>
            <strong>Average Case:</strong> Average number of steps for any input
            of size n
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Example:</h3>
        <p>Consider a sequential search in an array of size n.</p>
      </section>

      <section>
        <h3 className="font-semibold">Ref.</h3>
        <ul className="list-disc list-inside text-blue-500 underline">
          <li>
            <a
              href="https://www.tutorialspoint.com/Algorithms-and-Complexities?fbclid=IwAR0F12_mkFt8hoQLfRkWjbVhKXEvdodMDrM5fE3_MrlSBuVRo4I1OXuHt4U"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tutorialspoint - Algorithms and Complexities
            </a>
          </li>
          <li>
            <a
              href="https://www.hackerearth.com/practice/notes/complexity/"
              target="_blank"
              rel="noopener noreferrer"
            >
              HackerEarth - Complexity Notes
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default IntroToAlgorithmsContent;
