import { emailAdapter } from "../../adapters/email.adapter";

export const getAuthManager = {
  async sendRegistrationConfirmation(to: string, token: string) {
    const subject = "Registration confirmation";
    const text =
      "Welcome! Follow the link to confirm registration and activate your account.";
    const html = `<p>Welcome! Follow the <a href="https://localhost:3003/auth/confirm-registration?code=${token}">verification link</a> to confirm registration and activate your account.</p>`;
    await emailAdapter.send(to, subject, text, html);
  },
};
