import { PlaywrightCrawler, playwrightUtils, RequestQueue } from "crawlee";
import { createArrayCsvWriter } from "csv-writer";
import nodemailer, { SendMailOptions } from "nodemailer";
import { Query } from "./model/query.js";

const source = "https://urbania.pe";

const saleTypes = ["alquiler", "venta"];

const propertyTypes = ["departamentos", "casas"];

const districts = [
  "san-borja",
  "san-isidro",
  "santiago-de-surco",
  "miraflores",
  "barranco",
  "la-molina",
  "la-victoria",
  "magdalena-del-mar",
  "san-miguel",
  "santa-anita",
  "ate-vitarte",
  "lince",
  "jesus-maria",
  "surquillo",
  "chorrillos",
  "villa-el-salvador",
  "san-juan-de-miraflores",
];

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
      const priceNum = Number(price?.trim().split(" ")[1].split(",").join(""));

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

      const requestInfo = request.userData;
      records.push([
        title ?? "",
        url,
        requestInfo.saleType,
        requestInfo.propertyType,
        requestInfo.district,
        "lima",
        "lima",
        priceNum,
        areaNum,
      ]);
    }

    await csvWriter.writeRecords(records);

    // Add next pages
    const pageList = page.locator(
      "#root > div.sc-ps0squ-0.hiZnfm > div > div > div.sc-n5babu-0.dYNwNc > a"
    );

    for (let i = 0; i < (await pageList.count()); i++) {
      let pageNumber = await pageList.nth(i).textContent();
      if (pageNumber) {
        const newUrl = request.url.split("?")[0] + `?page=${pageNumber}`;
        requestQueue.addRequest({
          url: newUrl,
        });
      }
    }
  },
  requestQueue: requestQueue,
  maxConcurrency: 2,
  // headless: false,
});

const queryUrl = (
  saleType: string,
  propertyType: string,
  district: string,
  page: number = 1
) => {
  return `${source}/buscar/${saleType}-de-${propertyType}-en-${district}--lima--lima?page=${page}`;
};

export const sendScrappingCsv = async (query: Query, email: string) => {
  console.log("Adding requests")
  for (let i = 1; i <= 30; i++) {
    requestQueue.addRequest({
      url: queryUrl(query.saleType, query.propertyType, query.district, i),
      userData: {
        saleType: query.saleType,
        propertyType: query.propertyType,
        district: query.district,
      },
    });
  }
  console.log("Scrapping Urbania.pe")
  await crawler.run();

  // TODO no funciona usuario y contraseña. arreglar o probar smtp
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "patokloss@gmail.com",
      pass: "dsg5iu72KLmtdSF3",
    },
  });

  const mailOptions: SendMailOptions = {
    from: "patokloss@gmail.com",
    to: email,
    subject: `Scrapping Urbania ${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
    text: `Estos son los resultados de ${query.saleType} de ${query.propertyType} en ${query.district}`,
    attachments: [
      {
        filename: `scrapping-${new Date().toISOString()}.csv`,
        path: "files/output.csv",
      },
    ],
  };
  console.log("Sending email");
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log("Email sent: " + info.response);
    }
  })
};
