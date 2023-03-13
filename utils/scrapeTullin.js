const puppeteer = require("puppeteer");

const scrapeTullin = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://tullin.munu.shop/meny");

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // [monday, tuesday, ...]
  const menus = [[], [], [], [], []];

  const uls = await page.$$("ul");
  for (let i = 0; i <= 4; i++) {
    const lis = await uls[i].$$("li");
    for (let j = 0; j < lis.length; j++) {
      const text = await lis[j].evaluate((node) => node.innerText);
      menus[i][j] = text;
    }
  }
  await browser.close();
  return menus;
};

module.exports = scrapeTullin;
