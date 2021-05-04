const express = require("express");
const router = express.Router();
const Axios = require("axios");

const axiosConfig = require("../utils/axiosConfig");
const foodEmojis = require("../utils/food_emojis.json");
const categoryEmojis = require("../utils/category_emojis.json");

const sendToSlackChannel = async (blocks) => {
  try {
    await Axios.post(process.env.SLACK_WEBHOOK_URL, { blocks });
  } catch (err) {
    console.warn(err);
  }
};

const getRandomElementFromArray = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getEmojis = (dish, amount = 3) => {
  const emojis = new Set();

  for (const word of dish.name.split(" ")) {
    const wordLow = word.toLowerCase();
    if (Object.keys(foodEmojis).includes(wordLow) && emojis.size < amount) {
      emojis.add(
        Array.isArray(foodEmojis[wordLow])
          ? getRandomElementFromArray(foodEmojis[wordLow])
          : foodEmojis[wordLow]
      );
    }
  }

  // Adds general emojis if specific ones are not found
  while (emojis.size < amount) {
    emojis.add(getRandomElementFromArray(categoryEmojis[dish.category.name]));
  }
  return Array.from(emojis).join(" ");
};

const generateResponse = (menu) => {
  /* "accessory": {
    "type": "image",
    "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
    "alt_text": dish.name
  } */
  // add image (dish.image)

  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  const today = dd + "/" + mm;

  const generalInfo = {
    type: "header",
    text: {
      type: "plain_text",
      text: `(${today}) Dagens meny - Sundtkvartalet `,
      emoji: false,
    },
  };

  const divider = {
    type: "divider",
  };
  const menuOverview = menu.map((dish) => {
    const block = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${dish.name}*\n${getEmojis(dish)} _${
          dish.category.name
        }_ \n<https://Ojself.github.io/lunsjbot|Allergener>`,
      },
    };
    return block;
  });

  const githubInfo = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `Lunsjbot er <https://github.com/Ojself/lunsjbotinnhold|open source>`,
    },
  };

  return [generalInfo, divider, ...menuOverview, divider, githubInfo];
};

router.post("/", async (req, res) => {
  // simple and unsafe auth
  const { lunsj_secret } = req.body;
  if (!lunsj_secret || lunsj_secret !== process.env.LUNSJ_SECRET) {
    console.info("Failed auth");
    return res.send("Sent");
  }
  const result = await Axios(axiosConfig);
  const todaysMenu = result.data.data[0].availability[0].dishes;
  if (!todaysMenu) {
    throw new Error("Something went wrong");
  }
  const blocks = generateResponse(todaysMenu);
  sendToSlackChannel(blocks);
  res.send("Sent");
});

// no auth
router.get("/menu", async (req, res) => {
  const result = await Axios(axiosConfig);
  const menu = result.data.data[0].availability[0].dishes;
  if (!menu) {
    throw new Error("Something went wrong");
  }
  res.status(200).json({
    menu,
  });
});

module.exports = router;
