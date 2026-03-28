import createError from 'http-errors';
import express from 'express';
import path from "path";
import { fileURLToPath } from "url";

import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from "cors";
import dotenv from "dotenv";

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

var app = express();



dotenv.config();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-script", async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `
    Create a 45-second YouTube Shorts script on: "${topic}"

    Format:
    Hook (very engaging)
    Main content
    Ending (strong punchline)

    Keep it short, viral, and engaging.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const script = response.choices[0].message.content;

    res.json({ script });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
module.exports = app;
