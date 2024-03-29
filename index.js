require("dotenv").config();
const Axios = require("axios");
const { CronJob } = require("cron");

const scrapeTullin = require("./utils/scrapeTullin");
const axiosConfig = require("./utils/axiosConfig");
const foodEmojis = require("./utils/food_emojis.json");
const foodEmojiKeys = Object.keys(foodEmojis);
const categoryEmojis = require("./utils/category_emojis.json");
const timeZone = "Europe/Oslo";

const sendToSlackChannel = async (blocks) => {
  try {
    await Axios.post(process.env.SLACK_WEBHOOK_URL, {
      channel: "lunsj",
      text: "Dagens lunsj - Smaus",
      blocks,
    });
  } catch (err) {
    console.warn(err);
  }
};

const getRandomElementFromArray = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getEmojis = (dish, maxAmountEmojis = 3) => {
  const emojis = new Set();
  const splittedDish = dish.split(" ");

  // Exception for pølsefest as dish. returns -> "🌭🌭🌭"
  if (
    splittedDish.length === 1 &&
    splittedDish[0].toLowerCase() === "pølsefest"
  ) {
    return foodEmojis["pølse"].repeat(3);
  }
  splittedDish.forEach((word) => {
    const wordLow = word.toLowerCase().replace(/[^a-z|æøå|éèáà|äöë]/g, "");
    if (foodEmojiKeys.includes(wordLow) && emojis.size < maxAmountEmojis) {
      emojis.add(
        Array.isArray(foodEmojis[wordLow])
          ? getRandomElementFromArray(foodEmojis[wordLow])
          : foodEmojis[wordLow]
      );
    }
  });

  // Adds general emojis if specific ones are not found
  while (emojis.size < maxAmountEmojis) {
    const category = dish?.category?.name ? dish.category.name : "variousFood";
    emojis.add(getRandomElementFromArray(categoryEmojis[category]));
  }
  return Array.from(emojis).join(" ");
};

const generateSundtResponse = (menu) => {
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

  const divider = { type: "divider" };
  const menuOverview = menu.map((dish) => {
    const block = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${dish.name}*\n${getEmojis(dish.name)} _${
          dish.category.name
        }_ \n<https://ojself.github.io/lunsjbotinnhold|Allergener>`,
      },
    };
    return block;
  });

  const githubInfo = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Lunsjbot er <https://github.com/Ojself/lunsjbot|open source>",
    },
  };

  return [generalInfo, divider, ...menuOverview, divider, githubInfo];
};

const generateSmausResponse = (menu) => {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");

  const today = dd + "/" + mm;

  const generalInfo = {
    type: "header",
    text: {
      type: "plain_text",
      text: `(${today}) Dagens meny - Smaus `,
      emoji: false,
    },
  };

  const divider = { type: "divider" };
  const menuOverview = menu.map((dish) => {
    const block = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${dish}*\n${getEmojis(dish)}`,
      },
    };
    return block;
  });

  const githubInfo = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Lunsjbot is experimental and <https://github.com/Ojself/lunsjbot|open source>",
    },
  };

  return [generalInfo, divider, ...menuOverview, divider, githubInfo];
};

// Looks for the correct index based on date
const getDateIndex = (availability) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0"); // "24"
  return availability.findIndex((dayMenu) => {
    const date = dayMenu.period_start.split("T")[0].slice(-2);
    return dd === date;
  });
};

const sendTodaysMenuTullin = async () => {
  const result = await Axios(axiosConfig);
  // available dishes
  const { availability } = result.data.data[0];
  const index = getDateIndex(availability);
  const todaysMenu = availability[index].dishes;
  if (!todaysMenu) {
    throw new Error("Something went wrong");
  }
  const blocks = generateSundtResponse(todaysMenu);
  sendToSlackChannel(blocks);
};

const sendTodaysMenuSmaus = async () => {
  const result = await scrapeTullin();
  const todaysWeekdayIndex = new Date().getDay() - 1;

  const todaysMenu = result[todaysWeekdayIndex];
  if (!todaysMenu) {
    console.warn("Something went wrong");
    return;
  }

  const sanitizedMenu = todaysMenu.map((dish) => {
    // remove all "/n" from string
    const withOutCarriage = dish.replace(/(\r\n|\n|\r)/gm, "");
    return withOutCarriage;
  });

  const blocks = generateSmausResponse(sanitizedMenu);

  sendToSlackChannel(blocks);
};
sendTodaysMenuSmaus();

/* const sendTodaysMenuSmausJob = new CronJob(
  "30 * * * * *",
  () => {
    console.info("sendTodaysMenuSmausJob started");
    sendTodaysMenuSmaus();
  },
  null,
  true,
  timeZone
);

sendTodaysMenuSmausJob.start() */
