import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Transactional email. Email is the product's nervous system, so this is a
 * first-class abstraction. Dev transport logs to the console and writes each
 * message to `.mail/` so magic links are easy to grab during development.
 * Production swaps in Resend/SES behind the same `send()`.
 */
export type Email = { to: string; subject: string; text: string; html?: string };

export interface Mailer {
  send(email: Email): Promise<void>;
}

class DevMailer implements Mailer {
  async send(email: Email): Promise<void> {
    const dir = path.join(process.cwd(), ".mail");
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTo = email.to.replace(/[^a-z0-9@._-]/gi, "_");
    await writeFile(
      path.join(dir, `${stamp}_${safeTo}.txt`),
      `To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`,
    );
    console.log(`\n📧 [dev mail] To: ${email.to} — ${email.subject}\n${email.text}\n`);
  }
}

let _mailer: Mailer | undefined;
export function mailer(): Mailer {
  if (_mailer) return _mailer;
  _mailer = new DevMailer();
  return _mailer;
}
