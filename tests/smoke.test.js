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


test("PWA: оболочка кэшируется атомарно и с версией", async () => {
  const sw = await readFile(join(ROOT, "sw.js"), "utf8");
  assert.match(sw, /const CACHE = ["']silnye-stopy-shell-v[\d.]+["']/, "у кэша нет версии");
  assert.match(sw, /\.addAll\(SHELL\)/, "все ресурсы должны установиться одним набором");
  assert.match(sw, /cache\.match\(req/, "приложение должно сначала читать установленную оболочку");
  assert.doesNotMatch(sw, /fetch\(req\)\.then\([^)]*cache\.put/s, "фоновое обновление отдельных файлов запрещено");
  const shell = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  assert.ok(shell, "список ресурсов оболочки отсутствует");
  const entries = [...shell[1].matchAll(/["'](\.\/[^"']+)["']/g)].map(m => m[1]);
  assert.equal(new Set(entries).size, entries.length, "дубли в списке ресурсов");
  for (const item of entries) {
    if (item === "./") continue;
    const file = join(ROOT, item.slice(2));
    assert.ok((await stat(file)).isFile(), `отсутствует офлайн-ресурс: ${item}`);
  }
});


test("схема «Короткая стопа» не выдаёт рисунок за диагностический отпечаток", async () => {
  const src = await readFile(join(ROOT, "js/anim.js"), "utf8");
  assert.match(src, /A\.shortfoot=\{T:4/);
  const block = src.split("A.shortfoot={T:4")[1].split("A.tightrope=")[0];
  assert.match(block, /схема опоры/);
  assert.match(block, /свод активирован/);
  assert.match(block, /пальцы на полу/);
  assert.doesNotMatch(block, /стопа плоская|появилась выемка свода|отпечаток стопы/);
});


test("«Короткая стопа»: фазы движения сохраняют точки опоры", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const result = await page.evaluate(() => {
    const exercise = AN.shortfoot;
    if (!exercise || typeof exercise.f !== "function") return { missing: true };
    return [0, 0.125, 0.25, 0.5, 0.75].map(phase => {
      const svg = exercise.f(phase);
      return { phase, length: svg.length, supports: (svg.match(/class="acf"/g) || []).length,
        labels: svg.includes("пальцы на полу") && svg.includes("схема опоры"), invalid: /NaN|undefined|Infinity/.test(svg) };
    });
  });
  assert.ok(!result.missing, "нет анимации «Короткая стопа»");
  for (const frame of result) {
    assert.ok(frame.length > 300, `пустая фаза ${frame.phase}`);
    assert.ok(frame.supports >= 2, `нет обеих точек опоры в фазе ${frame.phase}`);
    assert.ok(frame.labels, `нет инструкций в фазе ${frame.phase}`);
    assert.ok(!frame.invalid, `некорректная геометрия в фазе ${frame.phase}`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});


test("все 27 аниме-схем имеют содержательные доступные подписи", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
  for (let i = 0; i < 27; i++) {
    await page.locator(".exr").nth(i).click();
    const label = await page.locator("#w-anim-svg").getAttribute("aria-label");
    assert.ok(label && label.includes("Исходное положение:") && label.includes("Движение:"), `нет инструкции в схеме ${i + 1}`);
    assert.ok(label.length > 65, `слишком короткая инструкция в схеме ${i + 1}`);
    await page.click("#w-close");
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});


test("аниме-геометрия: все 27 движений на ключевых фазах", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const frames = await page.evaluate(() => Object.entries(AN)
    .filter(([, value]) => value && typeof value.f === "function")
    .flatMap(([name, value]) => [0, 0.25, 0.5, 0.75, 0.99].map(phase => {
      const raw = value.f(phase);
      const svg = AN.sketchify(raw);
      const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      root.innerHTML = svg;
      return { name, phase, length: svg.length, invalid: /NaN|undefined|Infinity/.test(svg),
        elements: root.querySelectorAll("path,line,polyline,circle,ellipse,rect").length,
        transforms: [...root.querySelectorAll("[transform]")].every(el => {
          try { return !!el.transform.baseVal.consolidate() || el.transform.baseVal.numberOfItems === 0; }
          catch { return false; }
        }) };
    })));
  assert.equal(new Set(frames.map(f => f.name)).size, 27, "количество упражнений изменилось");
  for (const f of frames) {
    assert.ok(f.length > 200 && f.elements > 5, `пустая геометрия: ${f.name} / ${f.phase}`);
    assert.ok(!f.invalid, `неверные координаты: ${f.name} / ${f.phase}`);
    assert.ok(f.transforms, `некорректное преобразование: ${f.name} / ${f.phase}`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});


test("аниме-скетч: вторичные штрихи сохраняют повороты без дублирования transform", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const outcome = await page.evaluate(() => {
    const raw = '<path d="M0 0L10 10" class="ft" transform="rotate(20 5 5)"/>';
    const result = AN.sketchify(raw);
    const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    root.innerHTML = result;
    const paths = [...root.querySelectorAll("path")];
    return {
      count: paths.length,
      duplicate: /<path[^>]*\btransform="[^"]*"[^>]*\btransform="/.test(result),
      original: paths[0]?.getAttribute("transform"),
      secondary: paths[1]?.getAttribute("transform"),
      secondaryClass: paths[1]?.getAttribute("class")
    };
  });
  assert.equal(outcome.count, 2);
  assert.equal(outcome.duplicate, false);
  assert.equal(outcome.original, "rotate(20 5 5)");
  assert.match(outcome.secondary, /^translate\([^)]+\) rotate\(20 5 5\)$/);
  assert.match(outcome.secondaryClass, /\bsk2d\b/);
  assert.deepEqual(errors, []);
  await ctx.close();
});


test("26 индивидуальных аниме-эскизов: движение и подписи", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const result = await page.evaluate(() => {
    const names = Object.keys(AN).filter(n => AN[n] && typeof AN[n].f === "function" && n !== "shortfoot");
    return names.map(name => {
      const first = AN[name].f(0);
      const middle = AN[name].f(.5);
      const last = AN[name].f(.75);
      return { name, panel: first.includes('M4 128H236'),
        distinct: first !== middle || middle !== last,
        invalid: /NaN|undefined|Infinity/.test(first + middle + last) };
    });
  });
  assert.equal(result.length, 26);
  for (const item of result) {
    assert.ok(item.panel, "нет отдельного эскиза: " + item.name);
    assert.ok(item.distinct, "нет анимации: " + item.name);
    assert.ok(!item.invalid, "ошибка геометрии: " + item.name);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});
