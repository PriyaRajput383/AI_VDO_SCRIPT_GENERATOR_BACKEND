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

// ✅ config
dotenv.config();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// static (optional, can keep)
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// ✅ OpenAI

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
// ✅ AI route
app.post("/generate-script", async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `
  Create a 45-second YouTube Shorts script on: "${topic}"

  Format:
  Hook (very engaging)
  Main content
  Ending (strong punchline)
  `;

    const response = await openai.chat.completions.create({
  model: "meta-llama/llama-3-8b-instruct",
  messages: [{ role: "user", content: prompt }],
});

    res.json({ script: response.choices[0].message.content });

  } catch (error) {
  
      console.log("FULL ERROR:", error);
      res.status(500).json({ error: error.message });
    }
});

// ❌ remove render (we don't use EJS)
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    error: err.message
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ✅ FIX export
export default app;