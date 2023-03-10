import { PlaywrightCrawler, RequestQueue } from "crawlee";
import { selectors } from "playwright";
import { createArrayCsvWriter } from "csv-writer";
import { sendEmailCsv } from "./email.js";
import { Query } from "./model/query.js";
import environment from "./environment.js";

const source = "https://urbania.pe";
selectors.setTestIdAttribute("data-qa");

const queryUrl = (
  saleType: string,
  propertyType: string,
  district: string,
  page: number = 1
) => {
  return `${source}/buscar/${saleType}-de-${propertyType}-en-${district}--lima--lima?page=${page}`;
};

export const sendScrappingCsv = async (query: Query, email: string) => {
  const requestQueue = await RequestQueue.open();

  const csvWriter = createArrayCsvWriter({
    // path: `storage/datasets/crawl-${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.csv`,
    path: "files/output.csv",
    header: [
      "title",
      "url",
      "saleType",
      "propertyType",
      "district",
      "province",
      "department",
      "price",
      "area",
      "areaTotal"
    ],
  });

  let isFirstCrawl = true;
  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
      console.log(request.url);
      // Add all pages at once only the first time
      if (isFirstCrawl) {
        const numberOfItemsTitle = await page
          .locator(
            "#root > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h1"
          )
          .textContent();
        const numberOfItems = Number(numberOfItemsTitle?.trim().split(" ")[0]);
        const numberOfPages = Math.ceil(numberOfItems / 20);
        for (let i = 2; i <= numberOfPages; i++) {
          const newUrl = request.url.split("?")[0] + `?page=${i}`;
          requestQueue.addRequest({
            url: newUrl,
          });
        }
        isFirstCrawl = false;
      }

      const list = page.locator("div.postings-container > div");

      let records: any[][] = [];

      for (let i = 0; i < (await list.count()); i++) {
        const title = await list
          .nth(i)
          .locator(
            "div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1)"
          )
          .textContent();
          console.log(title)

        const price = await list
          .nth(i)
          .getByTestId("POSTING_CARD_PRICE")
          .first()
          .textContent();
        const priceNum = Number(
          price?.trim().split(" ")[1].split(",").join("")
        );

        const features = list.nth(i).getByTestId("POSTING_CARD_FEATURES");

        const area = await features
          .locator("span:nth-child(1) > span")
          .textContent();
        const areaNum = Number(area?.trim().split(" ")[0]);

        const areaTotal = await features
          .locator("span:nth-child(2) > span")
          .textContent();
        const areaTotalNum = Number(areaTotal?.trim().split(" ")[0]);

        const relativeUrl = await list
          .nth(i)
          .locator("div")
          .first()
          // fix type
          .evaluate((node: any) => {
            return node.attributes.getNamedItem("data-to-posting")?.nodeValue;
          });
        const url = source + relativeUrl;

        records.push([
          title ?? "",
          url,
          query.saleType,
          query.propertyType,
          query.district,
          "lima",
          "lima",
          priceNum,
          areaNum,
          areaTotalNum
        ]);
      }

      await csvWriter.writeRecords(records);
    },
    requestQueue: requestQueue,
  });

  requestQueue.addRequest({
    url: queryUrl(query.saleType, query.propertyType, query.district),
  });

  console.log("Scrapping Urbania.pe");
  await crawler.run();

  // sendEmailCsv(
  //   email,
  //   `Estos son los resultados de ${query.saleType} de ${query.propertyType} en ${query.district}`,
  //   "files/output.csv"
  // );

  return "output.csv";
};

const query: Query = {
  saleType: "alquiler",
  propertyType: "departamentos",
  district: "barranco",
};

// const start = performance.now();
await sendScrappingCsv(query, "sebastianknell@hotmail.com");
// const end = performance.now();
// console.log(`Time: ${(end - start) / 1000}s`);
