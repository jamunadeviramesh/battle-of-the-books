import React, { useState, useEffect } from "react";
import questionsData from "./questions.json";  // ← add this line

console.log("Questions loaded:", questionsData.length);
console.log("First question:", questionsData[0]);


function App() {
  // 📄 Upload
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // 🎯 Quiz
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState("");

  // 🏆 Score
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [locked, setLocked] = useState(false);

  // ⏱️ Timer
  const [timeLeft, setTimeLeft] = useState(40);
  const [timerActive, setTimerActive] = useState(false);

  // 📊 Stats
  const [booksLoaded, setBooksLoaded] = useState(0);
  const [questionsLoaded, setQuestionsLoaded] = useState(0);

  // 🎛️ Category filter
  const [selectedCategory, setSelectedCategory] = useState("All");
  const CATEGORIES = [
    "All",
    "Direct Quotes",
    "Events and Plot Details",
    "Passages from the Text",
    "Book Design and Illustrations",
  ];

  // 📄 Upload PDF
  const uploadPDF = async () => {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    setLoading(true);
    setUploadStatus("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setUploadStatus("❌ " + data.error);
      } else {
        setBooksLoaded(data.bookCount);
        setQuestionsLoaded(data.questionCount);
        setUploadStatus(
          `✅ Loaded ${data.questionCount} questions across ${data.bookCount} books!`
        );
      }
    } catch (err) {
      setUploadStatus("❌ Could not reach server. Is it running on port 3001?");
    }

    setLoading(false);
  };

  // 🎯 Load question
  const loadQuestion = async () => {
    const categoryParam =
      selectedCategory !== "All"
        ? `?category=${encodeURIComponent(selectedCategory)}`
        : "";

    try {
      const res = await fetch(`http://localhost:3001/quiz${categoryParam}`);
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setQuestion(data.question);
      setCategory(data.category || "");
      setOptions(data.options);
      setAnswer(data.answer);
      setSelected("");
      setResult("");
      setLocked(false);
      setTimeLeft(40);
      setTimerActive(true);
    } catch (err) {
      alert("Could not reach server. Is it running on port 3001?");
    }
  };

  // ⏱️ Timer
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft === 0) {
      setTimerActive(false);
      setLocked(true);
      setResult(`⏰ Time's up! Answer: ${answer}`);
      return;
    }

    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive, answer]);

  // ✅ Submit
  const submitAnswer = () => {
    if (!selected || locked) return;

    setLocked(true);
    setTimerActive(false);

    if (selected === answer) {
      setScore((p) => p + 1);
      setResult("✅ Correct!");
    } else {
      setResult(`❌ Wrong! Correct answer: ${answer}`);
    }
  };

  // ➡️ Next
  const nextQuestion = () => {
    setQuestionNumber((p) => p + 1);
    loadQuestion();
  };

  // 🎨 Timer color
  const timerColor =
    timeLeft > 20 ? "green" : timeLeft > 10 ? "orange" : "red";

  // 🏷️ Category badge colors
  const categoryColors = {
    "Direct Quotes": "#9c27b0",
    "Events and Plot Details": "#0f6e56",
    "Passages from the Text": "#b8640a",
    "Book Design and Illustrations": "#c62a6b",
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>🏆 Battle of the Books</h1>

      {/* ── Upload Section ── */}
      <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0 }}>📄 Upload Question PDF</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />
        <button
          onClick={uploadPDF}
          disabled={loading}
          style={{ padding: "8px 20px" }}
        >
          {loading ? "⏳ Processing..." : "Upload PDF"}
        </button>
        {uploadStatus && (
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>{uploadStatus}</p>
        )}
        {questionsLoaded > 0 && (
          <p style={{ color: "#555", fontSize: "14px" }}>
            📚 {booksLoaded} books · {questionsLoaded} questions ready
          </p>
        )}
      </div>

      {/* ── Category Filter ── */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Filter by category: </strong>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              margin: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              background: selectedCategory === cat ? "#333" : "#fff",
              color: selectedCategory === cat ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <hr />

      {/* ── Score & Question Number ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "16px 0",
        padding: "12px 20px",
        background: "#f5f5f5",
        borderRadius: "8px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#888" }}>Question</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>#{questionNumber}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "#888" }}>Score</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2e7d32" }}>{score}</div>
        </div>
      </div>

      {/* ── Timer ── */}
      <div style={{ textAlign: "center", margin: "12px 0" }}>
        <span style={{ fontSize: "56px", fontWeight: "bold", color: timerColor }}>
          {timeLeft}
        </span>
        <div style={{ fontSize: "13px", color: "#888" }}>seconds remaining</div>
      </div>

      {/* ── Start Button ── */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={loadQuestion}
          style={{
            padding: "12px 32px",
            fontSize: "18px",
            background: "#1565c0",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {question ? "🔄 New Question" : "▶️ Start Quiz"}
        </button>
      </div>

      {/* ── Question ── */}
      {question && (
        <>
          {/* Category Badge */}
          {category && (
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <span
                style={{
                  background: categoryColors[category] || "#555",
                  color: "white",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                {category}
              </span>
            </div>
          )}

          {/* Question Text */}
          <div
            style={{
              background: "#e8f4fd",
              border: "1px solid #90caf9",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
              fontSize: "17px",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            {question}
          </div>

          {/* Answer Options */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}>
            {options.map((opt, i) => {
              let bg = "#fff";
              let border = "1px solid #ccc";

              if (selected === opt && !locked) {
                bg = "#bbdefb";
                border = "2px solid #1565c0";
              }
              if (locked && opt === answer) {
                bg = "#c8e6c9";
                border = "2px solid green";
              }
              if (locked && selected === opt && opt !== answer) {
                bg = "#ffcdd2";
                border = "2px solid red";
              }

              return (
                <button
                  key={i}
                  disabled={locked}
                  onClick={() => setSelected(opt)}
                  style={{
                    background: bg,
                    border,
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: locked ? "default" : "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    lineHeight: "1.4",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <button
              onClick={submitAnswer}
              disabled={locked || !selected}
              style={{
                padding: "10px 28px",
                fontSize: "16px",
                background: locked || !selected ? "#ccc" : "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: locked || !selected ? "default" : "pointer",
              }}
            >
              Submit Answer
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              style={{
                textAlign: "center",
                fontSize: "20px",
                fontWeight: "bold",
                padding: "12px",
                borderRadius: "8px",
                background: result.startsWith("✅")
                  ? "#e8f5e9"
                  : result.startsWith("⏰")
                  ? "#fff3e0"
                  : "#ffebee",
                marginBottom: "16px",
              }}
            >
              {result}
            </div>
          )}

          {/* Next Question Button */}
          {locked && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={nextQuestion}
                style={{
                  padding: "10px 28px",
                  fontSize: "16px",
                  background: "#6a1b9a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ➡️ Next Question
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;