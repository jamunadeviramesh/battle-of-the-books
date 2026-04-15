import React, { useState, useEffect } from "react";
import questionsData from "./questions.json";

// ── helpers ──────────────────────────────────────────────────────────────────

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const ALL_BOOK_TITLES = [...new Set(questionsData.map((q) => q.answer))];

const CATEGORIES = [
  "All",
  "Direct Quotes",
  "Events and Plot Details",
  "Passages from the Text",
  "Book Design and Illustrations",
];

const CATEGORY_COLORS = {
  "Direct Quotes": "#9c27b0",
  "Events and Plot Details": "#0f6e56",
  "Passages from the Text": "#b8640a",
  "Book Design and Illustrations": "#c62a6b",
};

// ── component ─────────────────────────────────────────────────────────────────

function App() {
  // 🎯 Quiz state
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [options, setOptions]   = useState([]);
  const [answer, setAnswer]     = useState("");
  const [selected, setSelected] = useState("");
  const [result, setResult]     = useState("");

  // 🏆 Score
  const [score, setScore]                   = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [locked, setLocked]                 = useState(false);

  // ⏱️ Timer
  const [timeLeft, setTimeLeft]       = useState(35);
  const [timerActive, setTimerActive] = useState(false);

  // 🎛️ Category filter
  const [selectedCategory, setSelectedCategory] = useState("All");

  // ── load a question ───────────────────────────────────────────────────────

  const loadQuestion = (isFirst = false) => {
    setQuestionNumber((p) => (isFirst ? 1 : p + 1));

    const pool =
      selectedCategory !== "All"
        ? questionsData.filter((q) => q.category === selectedCategory)
        : questionsData;

    const activePool = pool.length > 0 ? pool : questionsData;
    const q          = activePool[Math.floor(Math.random() * activePool.length)];
    const correct    = q.answer;
    const wrong      = shuffle(ALL_BOOK_TITLES.filter((b) => b !== correct)).slice(0, 8);
    const opts       = shuffle([...wrong, correct]);

    setQuestion(q.question);
    setCategory(q.category || "");
    setOptions(opts);
    setAnswer(correct);
    setSelected("");
    setResult("");
    setLocked(false);
    setTimeLeft(35);
    setTimerActive(true);
  };

  // ── timer ─────────────────────────────────────────────────────────────────

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

  // ── submit ────────────────────────────────────────────────────────────────

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

  // ── derived ───────────────────────────────────────────────────────────────

  const timerColor = timeLeft > 20 ? "green" : timeLeft > 10 ? "orange" : "red";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>🏆 Huntrix Hearts - Battle of the Books</h1>

      {/* ── Stats bar ── */}
      <div style={{
        background: "#f5f5f5",
        padding: "10px 16px",
        borderRadius: "8px",
        marginBottom: "16px",
        fontSize: "13px",
        color: "#555",
      }}>
        📚 {ALL_BOOK_TITLES.length} books · {questionsData.length} questions loaded
      </div>

      {/* ── Category filter ── */}
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

      {/* ── Score & question number ── */}
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

      {/* ── Start / New Question button ── */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={() => loadQuestion(!question)}
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
          {/* Category badge */}
          {category && (
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <span style={{
                background: CATEGORY_COLORS[category] || "#555",
                color: "white",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold",
              }}>
                {category}
              </span>
            </div>
          )}

          {/* Question text */}
          <div style={{
            background: "#e8f4fd",
            border: "1px solid #90caf9",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            fontSize: "17px",
            lineHeight: "1.6",
            textAlign: "center",
          }}>
            {question}
          </div>

          {/* Answer options */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}>
            {options.map((opt, i) => {
              let bg     = "#fff";
              let border = "1px solid #ccc";
              if (selected === opt && !locked)                  { bg = "#bbdefb"; border = "2px solid #1565c0"; }
              if (locked && opt === answer)                     { bg = "#c8e6c9"; border = "2px solid green"; }
              if (locked && selected === opt && opt !== answer) { bg = "#ffcdd2"; border = "2px solid red"; }

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

          {/* Submit */}
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
            <div style={{
              textAlign: "center",
              fontSize: "20px",
              fontWeight: "bold",
              padding: "12px",
              borderRadius: "8px",
              background: result.startsWith("✅") ? "#e8f5e9" : result.startsWith("⏰") ? "#fff3e0" : "#ffebee",
              marginBottom: "16px",
            }}>
              {result}
            </div>
          )}

          {/* Next question */}
          {locked && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => loadQuestion()}
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
