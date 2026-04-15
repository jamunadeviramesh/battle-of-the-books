const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

let questions = [];
let bookTitles = [];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const BOOK_HEADER_PATTERNS = [
  { pattern: /The Buffalo are Back/i, answer: "The Buffalo are Back By Jean Craighead George" },
  { pattern: /Air by Monica Roe/i, answer: "Air By Monica Roe" },
  { pattern: /Finally Seen/i, answer: "Finally Seen By Kelly Yang" },
  { pattern: /Invisible by Christina/i, answer: "Invisible By Christina Diaz Gonzalez" },
  { pattern: /Rover'?s Story/i, answer: "A Rover's Story By Jasmine Warga" },
  { pattern: /Wishtree/i, answer: "Wishtree By Katherine Applegate" },
  { pattern: /Restart/i, answer: "Restart By Gordon Korman" },
  { pattern: /How to Stay Invisible/i, answer: "How to Stay Invisible By Maggie C. Rudd" },
  { pattern: /Finch House/i, answer: "Finch House By Ciera Burch" },
];

function detectCategory(sectionLetter, sectionTitle) {
  const title = (sectionTitle || "").toLowerCase();
  if (title.includes("direct quote") || title.includes("spoken line")) return "Direct Quotes";
  if (title.includes("statement") || title.includes("something that happens") || title.includes("plot")) return "Events and Plot Details";
  if (title.includes("passage")) return "Passages from the Text";
  if (title.includes("illustration") || title.includes("picture") || title.includes("author") || title.includes("publisher") || title.includes("design") || title.includes("acknowledgement")) return "Book Design and Illustrations";
  const map = { "A": "Book Design and Illustrations", "B": "Events and Plot Details", "C": "Passages from the Text", "D": "Book Design and Illustrations", "E": "Book Design and Illustrations" };
  return map[sectionLetter] || "Events and Plot Details";
}

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  const rawLines = data.text.split("\n").map(l => l.trim()).filter(Boolean);

  // First pass — join continuation lines onto the previous numbered item
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isNumbered = /^\d+\./.test(line);
    const isSectionHeader =
      /^[IVX]+\./.test(line) ||
      /^[A-E]\./.test(line) ||
      /^Chapter\s+\d+/i.test(line);

    if (isNumbered || isSectionHeader) {
      lines.push(line);
    } else if (lines.length > 0) {
      const last = lines[lines.length - 1];
      // Append if previous line looks incomplete
      if (!/[?."']$/.test(last)) {
        lines[lines.length - 1] = last + " " + line;
      } else {
        lines.push(line);
      }
    } else {
      lines.push(line);
    }
  }

  const parsed = [];
  let currentBook = null;
  let currentCategory = "Events and Plot Details";
  let currentSectionTitle = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect book header (Roman numeral + book title)
    if (/^[IVX]+\./.test(line)) {
      for (const bp of BOOK_HEADER_PATTERNS) {
        if (bp.pattern.test(line)) {
          currentBook = bp.answer;
          if (!bookTitles.includes(currentBook)) bookTitles.push(currentBook);
          break;
        }
      }
      continue;
    }

    // Detect section header like "A. Direct quote..." or "B. Statement..."
    const sectionMatch = line.match(/^([A-E])\.\s+(.+)/);
    if (sectionMatch) {
      currentSectionTitle = sectionMatch[2];
      currentCategory = detectCategory(sectionMatch[1], currentSectionTitle);
      continue;
    }

    // Skip chapter labels
    if (/^Chapter\s+\d+/i.test(line)) continue;

    // Detect numbered question/content lines
    const qMatch = line.match(/^\d+\.\s+(.+)/);
    if (!qMatch || !currentBook) continue;

    let questionText = qMatch[1].trim();

    const isExplicitQuestion =
      /^(In which|Which book|From which|What book)/i.test(questionText);

    const isQuotedLine = questionText.startsWith('"');

    if (currentCategory === "Direct Quotes") {
      if (isQuotedLine) {
        // Quoted dialogue lines are the question content
        parsed.push({
          question: `From which book does a character say: ${questionText}`,
          answer: currentBook,
          category: "Direct Quotes",
        });
      } else if (isExplicitQuestion) {
        if (!questionText.endsWith("?")) questionText += "?";
        parsed.push({
          question: questionText,
          answer: currentBook,
          category: "Direct Quotes",
        });
      }

    } else if (currentCategory === "Events and Plot Details") {
      if (isExplicitQuestion) {
        if (!questionText.endsWith("?")) questionText += "?";
        parsed.push({
          question: questionText,
          answer: currentBook,
          category: "Events and Plot Details",
        });
      }

    } else if (currentCategory === "Passages from the Text") {
      if (isExplicitQuestion) {
        if (!questionText.endsWith("?")) questionText += "?";
        parsed.push({
          question: questionText,
          answer: currentBook,
          category: "Passages from the Text",
        });
      } else if (questionText.length > 10 && !isExplicitQuestion) {
        // Short passage text — wrap as question
        parsed.push({
          question: `Which book contains this passage: "${questionText}"?`,
          answer: currentBook,
          category: "Passages from the Text",
        });
      }

    } else if (currentCategory === "Book Design and Illustrations") {
      if (isExplicitQuestion) {
        if (!questionText.endsWith("?")) questionText += "?";
        parsed.push({
          question: questionText,
          answer: currentBook,
          category: "Book Design and Illustrations",
        });
      } else if (questionText.length > 10) {
        // Publisher/author facts — wrap as question
        parsed.push({
          question: `Which book has this detail: "${questionText}"?`,
          answer: currentBook,
          category: "Book Design and Illustrations",
        });
      }
    }
  }

  return parsed;
}

// Upload PDF of questions
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    questions = [];
    bookTitles = [];

    const parsed = await parsePDF(req.file.path);

    if (parsed.length === 0) {
      return res.status(400).json({ error: "No questions found in PDF. Check the file format." });
    }

    questions = parsed;

    console.log(`✅ Loaded ${questions.length} questions across ${bookTitles.length} books`);
    console.log("📚 Books:", bookTitles);

    const cats = {};
    questions.forEach(q => { cats[q.category] = (cats[q.category] || 0) + 1; });
    console.log("📊 Categories:", cats);

    res.json({
      message: "Questions loaded!",
      questionCount: questions.length,
      bookCount: bookTitles.length,
      books: bookTitles,
    });
  } catch (err) {
    console.error("❌ Parse error:", err);
    res.status(500).json({ error: "Failed to parse PDF: " + err.message });
  }
});

// Quiz endpoint
app.get("/quiz", (req, res) => {
  if (questions.length === 0) return res.status(400).json({ error: "No questions loaded yet. Please upload the PDF first." });
  if (bookTitles.length < 2) return res.status(400).json({ error: "Need at least 2 books in the PDF." });

  const { category } = req.query;
  let pool = category ? questions.filter(q => q.category === category) : questions;
  if (pool.length === 0) pool = questions;

  const q = pool[Math.floor(Math.random() * pool.length)];
  const correct = q.answer;
  const wrong = shuffle(bookTitles.filter(b => b !== correct)).slice(0, 8);
  const options = shuffle([...wrong, correct]);

  res.json({
    question: q.question,
    category: q.category,
    options,
    answer: correct,
  });
});

// Status endpoint
app.get("/status", (req, res) => {
  const cats = {};
  questions.forEach(q => { cats[q.category] = (cats[q.category] || 0) + 1; });
  res.json({
    questions: questions.length,
    books: bookTitles,
    categories: cats,
  });
});

app.listen(3001, () => console.log("🚀 Server running on port 3001"));