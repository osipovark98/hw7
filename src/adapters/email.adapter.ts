import nodemailer from "nodemailer";

import { SETTINGS } from "../settings";

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: SETTINGS.EMAIL_SENDER,
    pass: SETTINGS.EMAIL_PASSWORD,
  },
});

export const emailAdapter = {
  async send(
    to: string | string[],
    subject: string,
    text: string,
    html?: string
  ) {
    const test = await transporter.sendMail({
      from: SETTINGS.EMAIL_SENDER,
      to,
      subject,
      text,
      html,
    });
    console.log(test);
  },
};
