import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailNotification = async (
  email: string,
  title: string,
  message: string,
) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: title,
      html: `<div style="font-family: Vazirmatn, sans-serif;">
        <h2>${title}</h2>
        <p>${message}</p>
        <hr />
        <p>پلتفرم آگهی</p>
      </div>`,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};
