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
  assert.match(sw, /\.addAll\(SHELL\.map\(/, "все ресурсы должны установиться одним набором");
  assert.match(sw, /cache: ?"reload"/, "при установке файлы берутся с сервера, а не из HTTP-кэша браузера");
  const app = await readFile(join(ROOT, "js/app.js"), "utf8");
  const ver = app.match(/APP_VERSION="([\d.]+)"/)[1];
  assert.ok(sw.includes(`silnye-stopy-shell-v${ver}"`), `имя кэша в sw.js должно совпадать с версией приложения ${ver} — иначе установленные PWA не обновятся`);
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


test("«Короткая стопа»: фазы движения сохраняют точки опоры", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const result = await page.evaluate(() => {
    const exercise = AN.shortfoot;
    if (!exercise || typeof exercise.f !== "function") return { missing: true };
    return [0, 0.125, 0.25, 0.5, 0.75].map(phase => {
      const svg = exercise.f(phase);
      return { phase, length: svg.length, supports: (svg.match(/class="acf"/g) || []).length,
        labels: /свод/.test(svg) && !/отпечаток стопы|появилась выемка/.test(svg), invalid: /NaN|undefined|Infinity/.test(svg) };
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


test("стиль «чистая линия»: единый контур под заливками, без карандашных штрихов", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const r = await page.evaluate(() => {
    const out = [];
    for (const k of ANIM_KEYS) {
      const svg = AN.draw(k, 0.3);
      if (/sk2d/.test(svg)) out.push(k + ": остались штрихи наброска");
      if (AN.sketchify(svg) !== svg) out.push(k + ": постобработка меняет рисунок");
    }
    const root = document.createElementNS("http://www.w3.org/2000/svg", "svg"); root.innerHTML = AN.draw("heron", 0.3);
    return { out, bo: root.querySelectorAll("path.bo").length, bf: root.querySelectorAll("path.bf").length };
  });
  assert.deepEqual(r.out, []);
  assert.ok(r.bo > 5 && r.bo === r.bf, "у каждой части силуэта должны быть контур и заливка");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схема и таймер: до «Старт» — исходное положение, движение в работе, пауза замораживает кадр", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
  const frame = () => page.locator("#w-anim-svg").innerHTML();
  await page.click(".exr >> nth=4");                 // «Медвежонок» — по таймеру
  await page.waitForTimeout(200);
  const idle = await frame(); await page.waitForTimeout(400);
  assert.equal(await frame(), idle, "до «Старт» схема должна стоять в исходном положении");
  await page.click("#w-main"); await page.waitForTimeout(1200);
  assert.equal(await frame(), idle, "на подготовке схема ещё не движется");
  await page.waitForTimeout(2400);                   // подготовка 3 с → работа
  const w1 = await frame(); await page.waitForTimeout(300);
  assert.notEqual(await frame(), w1, "в работе схема должна двигаться");
  await page.click("#w-main");                       // пауза
  const paused = await frame(); await page.waitForTimeout(500);
  assert.equal(await frame(), paused, "на паузе схема должна замереть");
  await page.click("#w-main"); await page.waitForTimeout(300);
  assert.notEqual(await frame(), paused, "после «Продолжить» схема снова движется");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схема и таймер: «держи» — поза удерживается, «расслабь» — возвращается в исходную", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
  const frame = () => page.locator("#w-anim-svg").innerHTML();
  await page.click(".exr >> nth=15");                // «Короткая стопа»: держи 5 с, расслабь 3 с
  await page.waitForTimeout(200);
  const rest = await frame();
  assert.match(rest, /свод расслаблен/);
  await page.click("#w-main"); await page.waitForTimeout(3000 + 1600);
  assert.match(await page.textContent("#w-sub"), /Держи/);
  const hold = await frame(); await page.waitForTimeout(600);
  assert.match(hold, /свод вверх/);
  assert.equal(await frame(), hold, "во время «держи» поза не должна меняться");
  await page.waitForTimeout(5000 - 2200 + 1800);
  assert.match(await page.textContent("#w-sub"), /Расслабь/);
  assert.equal(await frame(), rest, "на «расслабь» стопа возвращается в исходное положение");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схема: при смене ноги рисунок зеркалится, подписи остаются читаемыми; части сцены идут по шагам", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
  const frame = () => page.locator("#w-anim-svg").innerHTML();
  await page.click(".exr >> nth=19");                // «Цапля»: левая, затем правая
  await page.waitForTimeout(200);
  const left = await frame(); await page.click("#w-skip"); await page.waitForTimeout(200); const right = await frame();
  assert.match(left, /левая нога/); assert.match(right, /правая нога/);
  assert.notEqual(/scale\(-1 1\)/.test(left), /scale\(-1 1\)/.test(right), "для другой ноги рисунок должен быть зеркальным");
  const texts = await page.evaluate(() => [...document.querySelectorAll("#w-anim-svg text")].map(t => !t.closest("g[transform*='scale(-1']")));
  assert.ok(texts.length >= 2 && texts.every(Boolean), "текст оказался в зеркальной группе");
  await page.click("#w-close");
  await page.click(".exr >> nth=0");                 // «Круги»: шаг 1 — внутрь, шаг 2 — наружу
  await page.waitForTimeout(200); assert.match(await frame(), /круги внутрь/);
  await page.click("#w-skip"); await page.waitForTimeout(200); assert.match(await frame(), /круги наружу/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схемы ходьбы: лупа со стопами; «Уборка»: врезка с сидящей фигурой", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const r = await page.evaluate(() => ["soldier", "penguin", "rollwalk", "cleanup"].map(k => { const s = AN.draw(k, 0.3); return [k, /clipPath/.test(s), /class="insr"/.test(s)]; }));
  for (const [k, clip, ring] of r) assert.ok(clip && ring, k + ": нет врезки");
  assert.deepEqual(errors, []);
  await ctx.close();
});


/* ---------- Схемы: одна цельная сцена на упражнение, геометрия и вёрстка ---------- */
const PHASES = [0, 0.25, 0.5, 0.75, 1];

test("схемы: одна сцена на упражнение, без старых дополнительных панелей", async () => {
  const src = await readFile(join(ROOT, "js/anim.js"), "utf8");
  assert.doesNotMatch(src, /animeStudy|ANIME_STUDIES|motionDetail/, "в anim.js остались дополнительные эскизы поверх сцен");
  assert.doesNotMatch(src, /A\[name\]\.f\s*=\s*function/, "сцены не должны оборачиваться дополнительными рисунками");
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const r = await page.evaluate((PH) => ANIM_KEYS.map(k => {
    const sc = AN[k], out = { k, ok: !!(sc && typeof sc.f === "function" && sc.T > 0), insets: 0, panel: false, distinct: true };
    if (!out.ok) return out;
    AN.seed(5); const a = sc.f(0.25); AN.seed(5); const b = sc.f(0.5); AN.seed(5); const c = sc.f(0.75);
    out.distinct = a !== b && b !== c;
    PH.forEach(p => { const svg = sc.f(p); out.insets = Math.max(out.insets, (svg.match(/class="insr"/g) || []).length); if (svg.includes("M4 128H236")) out.panel = true; });
    return out;
  }), PHASES);
  assert.equal(r.length, 27);
  assert.equal(await page.evaluate(() => AN.VIEWBOX), "0 0 240 150");
  for (const x of r) {
    assert.ok(x.ok, `нет сцены у ${x.k}`);
    assert.ok(x.insets <= 1, `${x.k}: больше одной лупы`);
    assert.ok(!x.panel, `${x.k}: осталась нижняя полоса со вторым рисунком`);
    assert.ok(x.distinct, `${x.k}: сцена не двигается между фазами`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("схемы: все элементы внутри кадра, подписи не пересекаются со стрелками, персонажем и друг с другом", async () => {
  const ctx = await browser.newContext({ viewport: { width: 520, height: 400 } });
  const { page, errors } = await openApp(ctx);
  const problems = await page.evaluate((PH) => {
    const host = document.createElement("div"); host.className = "anim"; host.style.cssText = "position:fixed;left:0;top:0;width:480px;z-index:99";
    host.innerHTML = '<svg viewBox="' + AN.VIEWBOX + '"></svg>'; document.body.appendChild(host);
    const svg = host.firstChild, out = [];
    const SOLID = /\b(ac|acf|sk|skf|ft|ftf|ball|pin|insb|solea)\b/;
    function box(el, R, k) { const b = el.getBoundingClientRect(); return { x0: (b.left - R.left) / k, y0: (b.top - R.top) / k, x1: (b.right - R.left) / k, y1: (b.bottom - R.top) / k }; }
    function inter(a, b) { return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)); }
    ANIM_KEYS.forEach(k => PH.forEach(p => {
      AN.setFocus(AN[k].focus); AN.seed(3);
      svg.innerHTML = AN.sketchify(AN[k].f(p));
      const R = svg.getBoundingClientRect(), s = R.width / 240, texts = [], solids = [];
      svg.querySelectorAll("path,line,circle,ellipse,rect,text").forEach(el => {
        if (el.closest("defs,clipPath,[clip-path]")) return;
        const b = box(el, R, s);
        if (b.x0 < -1 || b.y0 < -1 || b.x1 > 241 || b.y1 > 151) out.push(`${k} ${p}: <${el.tagName} class="${el.getAttribute("class")}"> выходит за кадр (${b.x0.toFixed(1)},${b.y0.toFixed(1)})–(${b.x1.toFixed(1)},${b.y1.toFixed(1)})`);
        if (el.tagName === "text") { if (el.textContent) texts.push([el.textContent, b]); }
        else if (SOLID.test(el.getAttribute("class") || "")) solids.push([el.getAttribute("class"), b]);
      });
      texts.forEach((t, i) => {
        texts.slice(i + 1).forEach(u => { if (inter(t[1], u[1]) > 0.5) out.push(`${k} ${p}: подписи «${t[0]}» и «${u[0]}» пересекаются`); });
        solids.forEach(e => { if (inter(t[1], e[1]) > 1.5) out.push(`${k} ${p}: подпись «${t[0]}» наезжает на ${e[0]}`); });
      });
    }));
    host.remove();
    return out;
  }, PHASES);
  assert.deepEqual(problems, []);
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const [w, h] of [[360, 800], [390, 844], [430, 932]]) {
  test(`экран тренировки ${w}×${h}: схема во всю ширину, кнопка «Старт» видна, нет горизонтальной прокрутки`, async () => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const { page, errors } = await openApp(ctx);
    await page.click("#splash"); await page.click("#ack-ok"); await page.click("#tab-full");
    for (const i of [4, 8, 15, 18]) {               // длинное название, вид со стороны стоп, крупный план, лупа
      await page.locator(".exr").nth(i).click();
      await page.waitForTimeout(150);
      const m = await page.evaluate(() => {
        const a = document.querySelector(".anim").getBoundingClientRect(), b = document.getElementById("w-main").getBoundingClientRect();
        return { aw: a.width, ah: a.height, vw: innerWidth, vh: innerHeight, sw: document.scrollingElement.scrollWidth, bBottom: b.bottom,
          vb: document.getElementById("w-anim-svg").getAttribute("viewBox") };
      });
      assert.equal(m.vb, "0 0 240 150");
      assert.ok(Math.abs(m.aw - (w - 32)) < 2, `схема не во всю ширину: ${m.aw}`);
      assert.ok(Math.abs(m.ah / m.aw - 150 / 240) < 0.02, `пропорции схемы искажены: ${m.aw}×${m.ah}`);
      assert.ok(m.sw <= m.vw, "появилась горизонтальная прокрутка");
      assert.ok(m.bBottom <= m.vh, "кнопка «Старт» за пределами экрана");
      await page.click("#w-close");
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test("схемы: голова лёжа, подъём на носки, «Медвежонок» без лишних меток, умеренный свод в «Короткой стопе»", async () => {
  const ctx = await browser.newContext({ viewport: { width: 520, height: 400 } });
  const { page, errors } = await openApp(ctx);
  const r = await page.evaluate((PH) => {
    const host = document.createElement("div"); host.className = "anim"; host.style.cssText = "position:fixed;left:0;top:0;width:480px";
    host.innerHTML = '<svg viewBox="' + AN.VIEWBOX + '"></svg>'; document.body.appendChild(host);
    const svg = host.firstChild, out = [];
    function draw(k, p) { AN.setFocus(AN[k].focus); AN.seed(3); svg.innerHTML = AN.sketchify(AN[k].f(p)); return svg.getBoundingClientRect(); }
    function bb(el, R) { const b = el.getBoundingClientRect(), s = R.width / 240; return { x0: (b.left - R.left) / s, y0: (b.top - R.top) / s, x1: (b.right - R.left) / s, y1: (b.bottom - R.top) / s }; }
    PH.forEach(p => {
      for (const k of ["bike", "rags"]) {            // лицо к потолку, ничего не уходит под пол
        const R = draw(k, p), fl = bb(svg.querySelector("line.fl"), R).y0, iris = svg.querySelector(".iris");
        if (!iris || bb(iris, R).y1 > fl - 9) out.push(`${k} ${p}: лицо не смотрит вверх`);
        svg.querySelectorAll("path.bf").forEach(el => { if (!el.closest("[clip-path]") && bb(el, R).y1 > fl + 1) out.push(`${k} ${p}: контур ниже пола (${el.getAttribute("class")} ${bb(el, R).y1.toFixed(1)} > ${fl.toFixed(1)})`); });
      }
      { const R = draw("raise", p), fl = 142;         // передний отдел стоп всегда на полу
        const low = Math.max(...[...svg.querySelectorAll("path.bf")].map(el => bb(el, R)).filter(b => b.x0 > 95 && b.x1 < 140).map(b => b.y1));
        if (Math.abs(low - fl) > 1.2) out.push(`raise ${p}: стопы оторваны от пола (низ ${low.toFixed(1)}, пол ${fl})`); }
      { draw("bear", p); if (svg.querySelector("circle.acf")) out.push(`bear ${p}: лишняя оранжевая точка`); }
      { const R = draw("shortfoot", p), gap = svg.querySelector("path.gap");
        if (gap) { const b = bb(gap, R); if ((b.y1 - b.y0) / (b.x1 - b.x0) > 0.2) out.push(`shortfoot ${p}: слишком высокий свод (${((b.y1 - b.y0) / (b.x1 - b.x0)).toFixed(2)})`); } }
    });
    host.remove(); return out;
  }, PHASES);
  assert.deepEqual(r, []);
  assert.deepEqual(errors, []);
  await ctx.close();
});

/* Голос подсказок: подменяем системный синтез речи списком голосов, как на телефоне */
async function openWithVoices(voices) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((list) => {
    const spoken = []; window.__spoken = spoken;
    const ss = { speaking: false, pending: false, paused: false, getVoices: () => list, speak: (u) => spoken.push({ text: u.text, voice: u.voice && u.voice.name, pitch: u.pitch }),
      cancel() {}, resume() {}, addEventListener() {} };
    Object.defineProperty(window, "speechSynthesis", { value: ss, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; this.pitch = 1; this.voice = null; };
  }, voices);
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok"); await page.click("#h-settings");
  return { ctx, page, errors };
}

test("настройки: мужской голос подсказок — выбирается мужской голос телефона", async () => {
  const { ctx, page, errors } = await openWithVoices([
    { name: "Russian Russia", voiceURI: "ru-ru-x-ruc-local", lang: "ru-RU", localService: true },
    { name: "Russian Russia", voiceURI: "ru-ru-x-rud-local", lang: "ru-RU", localService: true },
    { name: "English", voiceURI: "en-us-x-sfg-local", lang: "en-US", localService: true }]);
  assert.equal(await page.getAttribute("#vk-female", "aria-checked"), "true", "по умолчанию женский голос");
  await page.click("#vk-male");
  assert.equal(await page.getAttribute("#vk-male", "aria-checked"), "true");
  const last = await page.evaluate(() => window.__spoken.filter(s => s.text.trim()).pop());
  assert.equal(last.voice, "Russian Russia");
  assert.equal(await page.evaluate(() => ruVoice.voiceURI), "ru-ru-x-rud-local", "должен выбраться мужской голос");
  assert.equal(last.pitch, 1, "настоящий мужской голос не понижаем");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("ss_set")).vkind), "male", "выбор сохраняется");
  await page.click("#vk-female");
  assert.equal(await page.evaluate(() => ruVoice.voiceURI), "ru-ru-x-ruc-local");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("настройки: мужского голоса на телефоне нет — подсказки ниже по тону, без пояснения", async () => {
  const { ctx, page, errors } = await openWithVoices([{ name: "Русский Россия", voiceURI: "Русский Россия", lang: "ru-RU", localService: true }]);
  await page.click("#vk-male");
  const last = await page.evaluate(() => window.__spoken.filter(s => s.text.trim()).pop());
  assert.ok(last.pitch < 0.8, "тон должен быть понижен");
  assert.equal(await page.locator("#voice-male-note").count(), 0, "пояснения о мужском голосе в настройках быть не должно");
  await page.click("#opt-voice");
  assert.ok(await page.isDisabled("#vk-male"), "при выключенных подсказках выбор голоса неактивен");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("музыка: планировщик не перезапускается при повторном рендере, отключение останавливает таймер", async () => {
  const ctx=await browser.newContext();
  const {page,errors}=await openApp(ctx);
  const result=await page.evaluate(async()=>{
    unlock();
    if(AC && AC.state==="suspended")await AC.resume();
    if(!AC)return {unsupported:true};
    const original={view:S.view,phase:S.phase,muted:S.muted,music:SET.music};
    S.view="work";S.phase="manual";S.muted=false;SET.music=true;
    updateMusic();
    const timer=MUS.timer;
    updateMusic();updateMusic();
    const stable=MUS.on && MUS.timer===timer && timer!==null;
    S.phase="idle";updateMusic();
    const stopped=!MUS.on && MUS.timer===null;
    Object.assign(S,{view:original.view,phase:original.phase,muted:original.muted});
    SET.music=original.music;
    return {stable,stopped};
  });
  if(!result.unsupported){assert.equal(result.stable,true);assert.equal(result.stopped,true);}
  assert.deepEqual(errors,[]);
  await ctx.close();
});

test("iPhone: подсказка установки в Safari, скрывается и не показывается в установленном приложении", async () => {
  const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok");
  assert.ok(await page.isVisible("#ios-hint"), "на iPhone в Safari нет подсказки установки");
  assert.ok((await page.textContent("#ios-hint")).includes("На экран"));
  await page.click("#ios-hint-x");
  assert.ok(await page.isHidden("#ios-hint"));
  await page.reload(); await page.click("#splash");
  assert.ok(await page.isHidden("#ios-hint"), "скрытая подсказка вернулась");
  const html = await readFile(join(ROOT, "index.html"), "utf8");
  assert.match(html, /rel="apple-touch-icon" href="apple-touch-icon.png"/);
  assert.equal((await stat(join(ROOT, "apple-touch-icon.png"))).isFile(), true);
  assert.deepEqual(errors, []);
  await ctx.close();
  // в установленном приложении (standalone) подсказки нет
  const ctx2 = await browser.newContext({ userAgent: UA, viewport: { width: 390, height: 664 } });
  await ctx2.addInitScript(() => { Object.defineProperty(navigator, "standalone", { value: true }); });
  const r2 = await openApp(ctx2);
  await r2.page.click("#splash"); await r2.page.click("#ack-ok");
  assert.ok(await r2.page.isHidden("#ios-hint"));
  await ctx2.close();
  // на Android подсказки нет
  const ctx3 = await browser.newContext();
  const r3 = await openApp(ctx3);
  await r3.page.click("#splash"); await r3.page.click("#ack-ok");
  assert.ok(await r3.page.isHidden("#ios-hint"));
  await ctx3.close();
});

test("дозировки одинаковые для левой и правой ноги (без акцента на одну сторону)", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  const bad = await page.evaluate(() => {
    const out = [];
    for (const id of ["short", "full"]) PLANS[id].blocks.forEach(b => b.ex.forEach(e => {
      if (/правой|левой/i.test(e.dose)) out.push(`${id}: «${e.short}» — в дозировке выделена одна нога: ${e.dose}`);
      const sum = { L: 0, R: 0 }, cnt = { L: 0, R: 0 };
      e.steps.forEach(s => { if (s.more) out.push(`${id}: «${e.short}» — шаг с пометкой more`);
        if (s.side) { cnt[s.side]++; sum[s.side] += s.k === "time" ? s.sec : s.k === "hold" ? s.reps * (s.hold + s.relax) : parseInt(s.text, 10) || 1; } });
      if (cnt.L !== cnt.R || sum.L !== sum.R) out.push(`${id}: «${e.short}» — нагрузка на ноги разная: Л ${sum.L} / П ${sum.R}`);
    }));
    return out;
  });
  assert.deepEqual(bad, []);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("настройки: уровень нагрузки «Лёгкий» уменьшает дозировки примерно до двух третей и сохраняется", async () => {
  const ctx = await browser.newContext();
  const { page, errors } = await openApp(ctx);
  await page.click("#splash"); await page.click("#ack-ok");
  const before = await page.evaluate(() => ({ n: EX.length, sec: planSec("full"), dose: EX.filter(e => e.short === "Ладошки")[0].dose }));
  await page.click("#h-settings");
  assert.equal(await page.getAttribute("#lv-normal", "aria-checked"), "true", "по умолчанию обычный уровень");
  await page.click("#lv-easy");
  assert.equal(await page.getAttribute("#lv-easy", "aria-checked"), "true");
  const easy = await page.evaluate(() => ({ n: EX.length, sec: planSec("full"), level: JSON.parse(localStorage.getItem("ss_set")).level,
    lad: EX.filter(e => e.short === "Ладошки")[0], bad: EX.filter(e => !e.dose || /undefined|NaN/.test(e.dose) || !e.steps.length || e.steps[e.steps.length - 1].k === "rest").map(e => e.short),
    orig: BY["Ладошки"].steps.filter(s => s.k === "hold")[0].reps }));
  assert.equal(easy.level, "easy", "выбор сохраняется");
  assert.equal(easy.n, before.n, "состав упражнений не меняется");
  assert.ok(easy.sec < before.sec * 0.8 && easy.sec > before.sec * 0.5, `время комплекса: ${easy.sec} против ${before.sec}`);
  assert.equal(easy.lad.steps.filter(s => s.k === "hold")[0].reps, 10);
  assert.equal(easy.orig, 15, "исходные дозировки не должны меняться");
  assert.match(easy.lad.dose, /10 раз с задержкой 3 секунды, 2 подхода/);
  assert.deepEqual(easy.bad, []);
  await page.reload(); await page.click("#splash");
  assert.match(await page.evaluate(() => EX.filter(e => e.short === "Ладошки")[0].dose), /^10 раз/, "после перезагрузки уровень остаётся лёгким");
  await page.click("#h-settings"); await page.click("#lv-normal");
  assert.equal(await page.evaluate(() => EX.filter(e => e.short === "Ладошки")[0].dose), before.dose);
  assert.deepEqual(errors, []);
  await ctx.close();
});
