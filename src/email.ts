import { createTransport, SendMailOptions } from "nodemailer";
import environment from "./environment";

/* export function sendEmailCsv(email: string, text: string, path: string) {
  const transporter = createTransport({
      host: environment.SMTP_HOST,
      port: environment.SMTP_PORT,
      auth: {
        user: environment.SMTP_USER,
        pass: environment.SMTP_PASS,
      },
    });

    const mailOptions: SendMailOptions = {
      from: "patokloss@gmail.com",
      to: email,
      subject: `Scrapping Urbania ${new Date().getDate()}-${
        new Date().getMonth() + 1
      }-${new Date().getFullYear()}`,
      text: text,
      attachments: [
        {
          filename: `scrapping-${new Date().toISOString()}.csv`,
          path: path,
        },
      ],
    };
    console.log("Sending email");
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
}
 */