const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// Color palette
const BG_COLOR = "#2563eb"; // blue-600
const ARROW_COLOR = "#ffffff";

function drawScrollIcon(ctx, size) {
  const padding = Math.round(size * 0.15);
  const center = size / 2;
  const radius = size / 2 - padding;

  // Circle background
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = BG_COLOR;
  ctx.fill();

  // Down arrow (chevrons stacked)
  ctx.strokeStyle = ARROW_COLOR;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(size * 0.08, 1.5);

  const arrowW = radius * 0.55;
  const gap = radius * 0.35;

  // Top chevron
  ctx.beginPath();
  ctx.moveTo(center - arrowW, center - gap);
  ctx.lineTo(center, center - gap + arrowW * 0.7);
  ctx.lineTo(center + arrowW, center - gap);
  ctx.stroke();

  // Bottom chevron
  ctx.beginPath();
  ctx.moveTo(center - arrowW, center + gap * 0.3);
  ctx.lineTo(center, center + gap * 0.3 + arrowW * 0.7);
  ctx.lineTo(center + arrowW, center + gap * 0.3);
  ctx.stroke();
}

// Generate icons
for (const size of [16, 48, 128]) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  drawScrollIcon(ctx, size);
  const out = path.join(__dirname, "..", "extension", "assets", `icon-${size}.png`);
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(`Generated ${out}`);
}

// Generate 1280x800 screenshot
function generateScreenshot() {
  const w = 1280, h = 800;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0f172a"); // slate-900
  grad.addColorStop(1, "#1e293b"); // slate-800
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Browser mockup
  const bx = 80, by = 80, bw = w - 160, bh = h - 160;
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;

  // Browser chrome
  roundRect(ctx, bx, by, bw, 40, 8, true);
  ctx.fillStyle = "#334155";
  ctx.fillRect(bx, by + 32, bw, 8);

  // Tab bar dots
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(bx + 20 + i * 18, by + 20, 5, 0, Math.PI * 2);
    ctx.fillStyle = ["#ef4444", "#eab308", "#22c55e"][i];
    ctx.fill();
  }

  // URL bar
  ctx.fillStyle = "#0f172a";
  roundRect(ctx, bx + 100, by + 10, 400, 22, 4, false);
  ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText("example.com/article", bx + 115, by + 26);

  // Content area
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx, by + 40, bw, bh - 40);

  // Fake text lines
  ctx.fillStyle = "#e2e8f0";
  for (let i = 0; i < 14; i++) {
    const lineW = 300 + Math.random() * 500;
    roundRect(ctx, bx + 60, by + 80 + i * 38, lineW, 12, 3, false);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
  }

  // Floating controller widget (bottom-right of browser)
  const cw = 180, ch = 50;
  const cx = bx + bw - cw - 30;
  const cy = by + bh - ch - 30;

  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#1e293b";
  roundRect(ctx, cx, cy, cw, ch, 25, false);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Controller buttons
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.arc(cx + 30, cy + ch / 2, 15, 0, Math.PI * 2);
  ctx.fill();

  // Play triangle
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(cx + 25, cy + ch / 2 - 8);
  ctx.lineTo(cx + 25, cy + ch / 2 + 8);
  ctx.lineTo(cx + 38, cy + ch / 2);
  ctx.closePath();
  ctx.fill();

  // Speed label
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("2.0x", cx + 60, cy + ch / 2 + 5);

  // Up/down arrows
  ctx.fillStyle = "#64748b";
  ctx.font = "18px sans-serif";
  ctx.fillText("\u25B2", cx + 120, cy + ch / 2 - 2);
  ctx.fillText("\u25BC", cx + 120, cy + ch / 2 + 16);

  // Title + tagline overlay
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  roundRect(ctx, 80, h - 200, 500, 120, 12, false);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("Auto Scroll", 110, h - 145);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px sans-serif";
  ctx.fillText("Smooth auto-scrolling with floating", 110, h - 115);
  ctx.fillText("controller and keyboard shortcuts", 110, h - 95);

  const out = path.join(__dirname, "..", "cws-assets", "screenshot-1280x800.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(`Generated ${out}`);
}

// Generate 440x280 promo tile
function generatePromoTile() {
  const w = 440, h = 280;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1e40af"); // blue-800
  grad.addColorStop(1, "#2563eb"); // blue-600
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Icon
  const iconSize = 64;
  const iconX = w / 2 - iconSize / 2;
  const iconY = 50;

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Arrow chevrons in icon
  const ic = iconX + iconSize / 2;
  const iy = iconY + iconSize / 2;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(ic - 14, iy - 8);
  ctx.lineTo(ic, iy + 2);
  ctx.lineTo(ic + 14, iy - 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ic - 14, iy + 4);
  ctx.lineTo(ic, iy + 14);
  ctx.lineTo(ic + 14, iy + 4);
  ctx.stroke();

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Auto Scroll", w / 2, 160);

  // Tagline
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "15px sans-serif";
  ctx.fillText("Smooth automatic page scrolling", w / 2, 195);
  ctx.fillText("with floating controller", w / 2, 215);

  // Keyboard shortcut badge
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(ctx, w / 2 - 50, 235, 100, 26, 13, false);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("Alt + S", w / 2, 252);

  const out = path.join(__dirname, "..", "cws-assets", "promo-440x280.png");
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(`Generated ${out}`);
}

// Generate store description
function generateStoreDescription() {
  const desc = `Auto Scroll - Smooth Automatic Page Scrolling

Tired of manually scrolling through long articles, documents, and feeds? Auto Scroll adds smooth, hands-free scrolling to any webpage with a single click.

KEY FEATURES:
• Floating controller — Start, stop, and adjust speed without touching the keyboard
• Keyboard shortcuts — Toggle with Alt+S, speed up/down with Alt+Arrow keys
• Per-site speed memory — Each website remembers your preferred scroll speed
• Adjustable speed — Fine-tune from slow reading pace to fast skimming

PRO FEATURES ($1.49/mo):
• Custom keyboard shortcuts — Remap all hotkeys to your preference
• Speed presets — Save and switch between speed profiles instantly
• Teleprompter mode — Highlighted reading line for presentations and scripts
• Cross-device sync — Your settings follow you everywhere

PERFECT FOR:
• Reading long articles and blog posts
• Browsing social media feeds
• Reviewing documents and contracts
• Teleprompter use during presentations
• Hands-free browsing while eating or multitasking

PRIVACY: Auto Scroll stores only your speed preferences locally using Chrome's built-in storage. No personal data collected, no analytics, no external servers.

Lightweight, fast, and built for Manifest V3. Install now and never manually scroll again.`;

  const out = path.join(__dirname, "..", "cws-assets", "store-description.txt");
  fs.writeFileSync(out, desc);
  console.log(`Generated ${out}`);
}

function roundRect(ctx, x, y, w, h, r, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
    ctx.fill();
  }
}

generateScreenshot();
generatePromoTile();
generateStoreDescription();
