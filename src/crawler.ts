import { PlaywrightCrawler, playwrightUtils, RequestQueue } from "crawlee";
import { createArrayCsvWriter } from "csv-writer";
import { sendEmailCsv } from "./email.js";
import { Query } from "./model/query.js";
import environment from "./environment.js";

const source = "https://urbania.pe";

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
    ],
  });

  let isFirstCrawl = true;
  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
      console.log(request.url);
      const list = page.locator(
        "#root > div.sc-ps0squ-0.hiZnfm > div > div > div.sc-185xmk8-1.iNSUmi > div.sc-185xmk8-2.bqddpd > div.postings-container > div"
      );

      let records: any[][] = [];

      for (let i = 0; i < (await list.count()); i++) {
        const title = await list
          .nth(i)
          .locator(
            "div > div > div.sc-i1odl-2.gIHCpf > div.sc-i1odl-3.VSxgr > div:nth-child(1) > div.sc-i1odl-5.cypYcv > div.sc-ge2uzh-1.dhzcWt > div.sc-ge2uzh-0.bzGYzE"
          )
          .textContent();

        const price = await list
          .nth(i)
          .locator(
            "div > div > div.sc-i1odl-2.gIHCpf > div.sc-i1odl-3.VSxgr > div:nth-child(1) > div.sc-i1odl-5.cypYcv > div.sc-i1odl-8.hmHSY > div.sc-12dh9kl-0.cysiyu > div.sc-12dh9kl-3.gGCVnu > div"
          )
          .nth(0)
          .textContent();
        const priceNum = Number(
          price?.trim().split(" ")[1].split(",").join("")
        );

        const area = await list
          .nth(i)
          .locator(
            "div > div > div.sc-i1odl-2.gIHCpf > div.sc-i1odl-3.VSxgr > div:nth-child(1) > div.sc-i1odl-5.bkbRHX > div > span:nth-child(1) > span"
          )
          .textContent();
        const areaNum = Number(area?.trim().split(" ")[0]);

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
        ]);
      }

      await csvWriter.writeRecords(records);

      // Add all pages at once only the first time
      // TODO esta fallando
      if (isFirstCrawl) {
        const numberOfItemsTitle = await page
          .locator(
            "#root > div.sc-ps0squ-0.hiZnfm > div > div > div.sc-185xmk8-1.iNSUmi > div.sc-185xmk8-2.bqddpd > div.sc-5z85om-0.hjpEnc > div.sc-5z85om-2.czixvV > h1"
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
    },
    requestQueue: requestQueue,
  });

  console.log("Adding requests");
  for (let i = 1; i <= 1; i++) {
    requestQueue.addRequest({
      url: queryUrl(query.saleType, query.propertyType, query.district, i),
    });
  }
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
// await sendScrappingCsv(query, "sebastianknell@hotmail.com");
// const end = performance.now();
// console.log(`Time: ${end - start}`);
