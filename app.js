const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const cors = require("cors");
const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, cb) => {
      cb(null, origin && origin.startsWith("http://localhost:"));
    },
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use("/", indexRouter);

module.exports = app;
