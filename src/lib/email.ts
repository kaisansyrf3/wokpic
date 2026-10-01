import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { siteConfig } from "@/config/site";

export type ContactEmailInput = {
  name: string;
  email: string;
  phone: string | null;
  serviceName: string | null;
  categoryName: string | null;
  body: string;
  createdAt: Date;
};

export type SendResult = { sent: true } | { sent: false; reason: "not-configured" | "failed" };

const HEADER_MAX_LENGTH = 160;

/** Header injection guard: nothing the visitor typed may break out of one line. */
function headerSafe(value: string): string {
  return value
    .replace(/[\r\n\u0000-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, HEADER_MAX_LENGTH);
}

function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split(/\r?\n/, 1)[0].replace(/[\u0000-\u001f\u007f]+/g, " ").slice(0, 200);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function lineBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function formatMoment(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: siteConfig.timezone,
  }).format(date);
}

let transporter: Transporter | null = null;

function gmailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!user || !password) return null;

  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
}

function buildHtml(message: ContactEmailInput): string {
  const rows: string[] = [];
  const row = (label: string, value: string | null) => {
    if (value) rows.push(`<tr><th align="left">${escapeHtml(label)}</th><td>${value}</td></tr>`);
  };

  row("Nama", escapeHtml(message.name));
  row("Email", `<a href="mailto:${encodeURIComponent(message.email)}">${escapeHtml(message.email)}</a>`);
  row("Telepon/WhatsApp", message.phone ? escapeHtml(message.phone) : null);
  row("Paket", message.serviceName ? escapeHtml(message.serviceName) : "Belum tahu, ingin konsultasi dulu");
  row("Kategori", message.categoryName ? escapeHtml(message.categoryName) : null);
  row("Waktu", escapeHtml(formatMoment(message.createdAt)) + " WIB");
  row("Pesan", lineBreaks(message.body));

  return [
    `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#070405">`,
    `<h2 style="font-size:16px;font-weight:600;margin:0 0 12px">Pesan baru lewat situs ${escapeHtml(siteConfig.name)}</h2>`,
    `<table role="presentation" cellpadding="12" cellspacing="0" style="border-collapse:collapse;vertical-align:top">`,
    `<tbody>${rows.join("")}</tbody>`,
    `</table>`,
    `<p style="margin:16px 0 0;color:#6b6b6b;font-size:12px">Balas email ini untuk menghubungi pengirim.</p>`,
    `</div>`,
  ].join("");
}

function buildText(message: ContactEmailInput): string {
  return [
    `Pesan baru lewat situs ${siteConfig.name}`,
    "",
    `Nama    : ${message.name}`,
    `Email   : ${message.email}`,
    `Telepon : ${message.phone ?? "-"}`,
    `Paket   : ${message.serviceName ?? "Belum tahu, ingin konsultasi dulu"}`,
    ...(message.categoryName ? [`Kategori: ${message.categoryName}`] : []),
    `Waktu   : ${formatMoment(message.createdAt)} WIB`,
    "",
    "Pesan:",
    message.body,
  ].join("\n");
}

export async function sendContactEmail(message: ContactEmailInput): Promise<SendResult> {
  const transport = gmailTransporter();
  if (!transport) {
    console.warn("[email] GMAIL_USER atau GMAIL_APP_PASSWORD belum diisi — pesan disimpan tanpa email.");
    return { sent: false, reason: "not-configured" };
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || process.env.GMAIL_USER;
  if (!to) return { sent: false, reason: "not-configured" };

  try {
    await transport.sendMail({
      from: `"Website ${headerSafe(siteConfig.name)}" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: headerSafe(message.email),
      subject: headerSafe(`[Website] Pesan baru dari ${message.name}`),
      text: buildText(message),
      html: buildHtml(message),
    });

    return { sent: true };
  } catch (error) {
    // Nodemailer errors can carry the SMTP handshake, which contains the base64
    // AUTH line, so only the first short line of the message is logged. The full
    // text is needed for `Invalid login`, which is how a wrong App Password shows up.
    console.error("[email] Pengiriman gagal:", firstLine(error));
    return { sent: false, reason: "failed" };
  }
}
