import createError from 'http-errors';
import express from 'express';
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const app = express();

// ✅ Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// ✅ CORS (allow Netlify frontend)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // allow all (fix now, secure later)
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // ✅ handle preflight request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Load env
dotenv.config();
// ✅ handle preflight
app.options("*", cors());

// ✅ Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ✅ Static files (optional)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// ✅ OpenAI (OpenRouter setup)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://scriptbyte.netlify.app", // your REAL frontend
    "X-Title": "ScriptByte"
  }
});

// ✅ AI Route
app.post("/generate-script", async (req, res) => {
  try {
    const { topic } = req.body;

    // 🔴 Validation
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const prompt = `
Create a 45-second YouTube Shorts script on: "${topic}"

Format:
- Hook (very engaging, 1-2 lines)
- Main content (fast-paced, relatable)
- Ending (strong punchline or twist)
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // 🔥 fast + good
      messages: [
        { role: "user", content: prompt }
      ],
    });

    const script = response.choices?.[0]?.message?.content;

    res.json({
      script: script || "No script generated"
    });

  } catch (error) {
  console.error("FULL ERROR:", error.response?.data || error.message);

  res.status(500).json({
    error: error.response?.data || error.message
  });
}
  
});

// ❌ 404 handler
app.use(function(req, res, next) {
  next(createError(404));
});

// ❌ Error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    error: err.message
  });
});

// ✅ PORT (important for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Export
export default app;