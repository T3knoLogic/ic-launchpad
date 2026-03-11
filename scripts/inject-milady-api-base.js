#!/usr/bin/env node
/**
 * Injects window.__MILADY_API_BASE__ into Milady frontend index.html.
 * Run after copying dist to milady-assets. Reads MILADY_API_BASE from env.
 *
 * Usage: MILADY_API_BASE=https://your-api.onrender.com node scripts/inject-milady-api-base.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../milady-assets/dist");
const indexPath = path.join(distDir, "index.html");

const apiBase = process.env.MILADY_API_BASE?.trim();
if (!apiBase) {
  console.warn(
    "[inject-milady-api-base] MILADY_API_BASE not set, skipping injection"
  );
  process.exit(0);
}

if (!fs.existsSync(indexPath)) {
  console.error(`[inject-milady-api-base] Not found: ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");
const inject = `<script>window.__MILADY_API_BASE__="${apiBase.replace(/"/g, '\\"')}";</script>`;

if (html.includes("__MILADY_API_BASE__")) {
  html = html.replace(
    /<script>window\.__MILADY_API_BASE__="[^"]*";<\/script>/,
    inject
  );
} else {
  html = html.replace("<head>", `<head>\n    ${inject}`);
}

fs.writeFileSync(indexPath, html);
console.log(`[inject-milady-api-base] Set __MILADY_API_BASE__ = ${apiBase}`);
