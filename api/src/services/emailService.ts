import nodemailer from "nodemailer";
import { config } from "../config";

// MailHog (dev) and relay1.dataart.com (prod) both accept plain SMTP on the
// configured port; no auth/TLS is assumed for the mandatory scope.
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
});

export async function sendVerificationEmail(
  email: string,
  rawToken: string,
): Promise<void> {
  const url = `${config.appBaseUrl}/verify?token=${encodeURIComponent(rawToken)}`;

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "Verify your Ticket Tracker account",
    text: [
      "Welcome to Ticket Tracker!",
      "",
      "Please verify your email address by visiting the link below:",
      url,
      "",
      "This link expires in 24 hours and can be used once.",
    ].join("\n"),
    html: `
      <p>Welcome to Ticket Tracker!</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${url}">Verify my account</a></p>
      <p>This link expires in 24 hours and can be used once.</p>
    `,
  });
}
