// Смоук-тесты «Сильных стоп»: npm test
// Поднимают локальный сервер с файлами репозитория и проверяют приложение в Chromium.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".css": "text/css; charset=utf-8", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8" };
let server, base, browser;

before(async () => {
  server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try { const body = await readFile(file); res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(body); }
    catch { res.writeHead(404).end("not found"); }
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function openApp(context) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base);
  return { page, errors };
}

test("файлы приложения на месте и не пустые", async () => {
  for (const f of ["index.html", "styles.css", "js/core.js", "js/exercises.js", "js/anim.js", "js/audio.js", "js/app.js",
    "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "fonts/GolosText.woff"]) {
    const s = await stat(join(ROOT, f));
    assert.ok(s.size > 500, `${f} пустой или слишком маленький (${s.size} байт)`);
  }
  const sw = await readFile(join(ROOT, "sw.js"), "utf8");
  assert.match(sw, /addEventListener\("fetch"/, "в sw.js нет обработчика запросов");
  const html = await readFile(join(ROOT, "index.html"), "utf8");
  assert.ok(!html.includes("fonts.googleapis.com"), "приложение не должно обращаться к внешним шрифтам");
  for (const f of ["styles.css", "js/core.js", "js/exercises.js", "js/anim.js", "js/audio.js", "js/app.js"]) {
    assert.ok(html.includes(f), `index.html не подключает ${f}`);
    assert.ok(sw.includes("./" + f), `sw.js не кэширует ${f} для офлайн-режима`);
  }
});

test("первый запуск: заставка с цитатой, затем предупреждение", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  assert.ok((await page.textContent("#q-text")).length > 10, "нет цитаты на заставке");
  await page.click("#splash");
  assert.ok(await page.isVisible("#sh-ack"), "нет предупреждения при первом запуске");
  await page.click("#ack-ok");
  await page.reload(); await page.click("#splash");
  assert.ok(!(await page.isVisible("#sh-ack")), "предупреждение показывается повторно");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("вкладки «30 минут» и «Полный»", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok");
  assert.equal(await page.locator(".exr").count(), 17);
  await page.click("#tab-full");
  assert.equal(await page.locator(".exr").count(), 27);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("тренировка: инвентарь, таймер и музыка", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok");
  await page.click("#h-start");
  assert.ok(await page.locator("#eq-list li").count() >= 5, "список инвентаря пуст");
  await page.click("#eq-go");
  assert.ok(await page.isVisible("#work"), "экран тренировки не открылся");
  assert.ok((await page.locator("#w-anim-svg").innerHTML()).length > 200, "нет схемы упражнения");
  await page.click("#w-close");
  await page.click(".exr >> nth=2");             // «Медвежонок» — упражнение с таймером
  await page.click("#w-main");
  await page.waitForTimeout(4000);
  assert.notEqual(await page.textContent("#w-sub"), "Нажми «Старт»", "таймер не запустился");
  assert.equal(await page.textContent("#w-main"), "Пауза");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схемы всех 27 упражнений рисуются без ошибок", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
  for (let i = 0; i < 27; i++) {
    await page.click(`.exr >> nth=${i}`);
    await page.waitForTimeout(120);
    const svg = await page.locator("#w-anim-svg").innerHTML();
    assert.ok(svg.length > 300, `пустая схема у упражнения ${i + 1}`);
    assert.ok(!/NaN|undefined/.test(svg), `ошибка в координатах схемы упражнения ${i + 1}`);
    await page.click("#w-close");
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("резервная копия: создать и восстановить", async () => {
  const ctx = await browser.newContext();
  const { page } = await openApp(ctx);
  await page.evaluate(() => localStorage.setItem("ss_hist", JSON.stringify(["2026-11-05", "2026-11-06"])));
  await page.reload(); await page.click("#splash"); await page.click("#ack-ok");
  await page.click("#h-settings"); await page.click("#bk-make");
  const code = await page.inputValue("#bk-code");
  assert.match(code, /^SS1:/);
  await page.evaluate(() => localStorage.setItem("ss_hist", "[]"));
  await page.fill("#bk-code", code); await page.click("#bk-restore");
  assert.equal(await page.evaluate(() => localStorage.getItem("ss_hist")), '["2026-11-05","2026-11-06"]');
  await ctx.close();
});

test("работает без интернета после первого запуска", async () => {
  const ctx = await browser.newContext();
  const { page } = await openApp(ctx);
  await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), null, { timeout: 10000 });
  await page.reload(); await page.waitForTimeout(800);
  await ctx.setOffline(true);
  await page.reload();
  assert.equal(await page.title(), "Сильные стопы");
  assert.ok((await page.textContent("h1")).includes("Сильные стопы"));
  await ctx.close();
});
