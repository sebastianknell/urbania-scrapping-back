import path from "path";
import { PlaywrightCrawler, RequestQueue, ProxyConfiguration } from "crawlee";
import { selectors } from "playwright";
import { createArrayCsvWriter } from "csv-writer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Query } from "./model/query.js";
import environment from "./environment.js";
import fs from "fs";

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

const s3 = new S3Client({
  credentials: {
    accessKeyId: environment.AWS_ACCESS_KEY_ID,
    secretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
  },
  region: "us-east-1",
});

export const sendScrappingCsv = async (query: Query, email: string) => {
  const requestQueue = await RequestQueue.open();

  const filename = `scrapping-${new Date().toISOString()}.csv`;
  const csvWriter = createArrayCsvWriter({
    path: path.join("files", filename),
    header: [
      // "title",
      "url",
      "saleType",
      "propertyType",
      "district",
      "province",
      "department",
      "location",
      "price",
      "totalArea",
      "roofedArea",
    ],
  });

  const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: [
      "http://ek6troeqn6:gwcb0uzelb-country-PE@resi.proxyscrape.com:8000",
    ],
  });

  let isFirstCrawl = true;
  const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    sessionPoolOptions: {
      maxPoolSize: 1
    },
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
        // const title = await list
        //   .nth(i)
        //   .locator(
        //     "div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1)"
        //   )
        //   .textContent();

        const location = await list
          .nth(i)
          .getByTestId("POSTING_CARD_LOCATION")
          .textContent();

        const price = await list
          .nth(i)
          .getByTestId("POSTING_CARD_PRICE")
          .first()
          .textContent();
        const priceNum = Number(
          price?.trim().split(" ")[1].split(",").join("")
        );

        const features = list.nth(i).getByTestId("POSTING_CARD_FEATURES");

        // Area total
        const totalArea = await features
          .locator("span:nth-child(1) > span")
          .textContent();
        const totalAreanNum = Number(totalArea?.trim().split(" ")[0]);

        // Area techada
        const roofedArea = await features
          .locator("span:nth-child(2) > span")
          .textContent();
        const roofedAreaNum = Number(roofedArea?.trim().split(" ")[0]);

        const relativeUrl = await list
          .nth(i)
          .locator("div")
          .first()
          .evaluate((node) => {
            return node.attributes.getNamedItem("data-to-posting")?.nodeValue;
          });
        const url = source + relativeUrl;

        records.push([
          // title ?? "",
          url,
          query.saleType,
          query.propertyType,
          query.district,
          "lima",
          "lima",
          location,
          priceNum,
          totalAreanNum,
          roofedAreaNum,
        ]);
      }

      await csvWriter.writeRecords(records);
    },
    requestQueue: requestQueue,
    maxConcurrency: 3,
  });

  await requestQueue.addRequest({
    url: queryUrl(query.saleType, query.propertyType, query.district),
  });

  console.log("Scrapping Urbania.pe");
  await crawler.run();
  await requestQueue.drop();
  
  const params = {
    Bucket: environment.S3_BUCKET,
    Key: filename,
    Body: fs.readFileSync(path.join("files", filename)),
  };

  await s3.send(new PutObjectCommand(params));

  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: environment.S3_BUCKET,
      Key: filename,
      ResponseContentDisposition: "attachment",
    }),
    {
      expiresIn: 3600
    }
  );

  return downloadUrl;
};

const query: Query = {
  saleType: "alquiler",
  propertyType: "departamentos",
  district: "surquillo",
};

// const start = performance.now();
// await sendScrappingCsv(query, "sebastianknell@hotmail.com");
// const end = performance.now();
// console.log(`Time: ${(end - start) / 1000}s`);
