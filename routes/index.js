const express = require("express");
const router = express.Router();
const Axios = require("axios");

const axiosConfig = require("../utils/axiosConfig");

// no auth
router.get("/ping", async (req, res) => {
  res.status(200).json({
    message: `Pong! ${Date.now()}`,
  });
});

// no auth
router.get("/menu", async (req, res) => {
  const result = await Axios(axiosConfig);
  const menu = result.data.data[0].availability[0].dishes;
  if (!menu) {
    throw new Error("Something went wrong");
  }
  res.status(200).json({ menu });
});

module.exports = router;
