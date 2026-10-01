import assert from "node:assert/strict";
import { test } from "node:test";

import { buildWhatsAppUrl, normalizeWhatsApp } from "./whatsapp.ts";

test("normalizeWhatsApp accepts the formats owners actually type", () => {
  assert.equal(normalizeWhatsApp("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsApp("+62 812-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsApp("6281234567890"), "6281234567890");
  assert.equal(normalizeWhatsApp("81234567890"), "6281234567890");
  assert.equal(normalizeWhatsApp("0812 3456 7890"), "6281234567890");
});

test("normalizeWhatsApp rejects anything that is not an Indonesian number", () => {
  assert.equal(normalizeWhatsApp(""), null);
  assert.equal(normalizeWhatsApp("0812-34"), null);
  assert.equal(normalizeWhatsApp("0812-3456-7890-1234"), null);
  assert.equal(normalizeWhatsApp("+1 555 0100"), null);
});

test("buildWhatsAppUrl names the package and the category tab", () => {
  const url = buildWhatsAppUrl("6281234567890", "WOKAI PICTURE", "Akad & Resepsi", "Wedding");

  assert.ok(url.startsWith("https://wa.me/6281234567890?text="));

  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.equal(
    text,
    'Halo WOKAI PICTURE, saya tertarik dengan paket "Akad & Resepsi" (kategori Wedding).\nMohon informasi lebih lanjut.',
  );
});

test("buildWhatsAppUrl leaves the category out when there is none", () => {
  const text = decodeURIComponent(
    buildWhatsAppUrl("6281234567890", "WOKAI PICTURE", "Prewedding").split("?text=")[1],
  );

  assert.ok(!text.includes("kategori"));
  assert.ok(text.includes('"Prewedding".'));
});
