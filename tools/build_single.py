#!/usr/bin/env python3
"""Собирает приложение в один HTML-файл (версия для публикации в Claude).

Использование: python3 tools/build_single.py [путь_к_результату]
Берёт index.html, styles.css и js/*.js, встраивает их в один файл,
шрифты подключает с Google Fonts, а манифест и сервис-воркер убирает.
"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / "dist" / "silnye-stopy.html")
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")
css = re.sub(r"@font-face\{[^}]*\}\n?", "", css)
FONTS = "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Martian+Mono:wght@500;700&family=Unbounded:wght@600;700&display=swap"
title = re.search(r"<title>.*?</title>", html).group(0)
theme = re.search(r"<script>(\(function\(\)\{var r=document\.documentElement.*?\}\)\(\);)</script>", html).group(1)
body = html[html.index("<body>") + 6: html.index('<script src="js/core.js">')].strip()
parts = []
for name in ["core", "exercises", "anim", "audio", "app"]:
    src = (root / "js" / (name + ".js")).read_text(encoding="utf-8")
    src = re.sub(r'^/\*.*?\*/\n"use strict";\n', "", src, count=1, flags=re.S)
    parts.append(src.strip())
single = (title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n'
          '<script>(function(){try{var l=document.createElement("link");l.rel="stylesheet";l.href="' + FONTS + '";document.head.appendChild(l);}catch(e){}})();\n'
          + theme + "</script>\n<style>\n" + css + "</style>\n" + body
          + '\n<script>\n(function(){\n"use strict";\n' + "\n\n".join(parts) + "\n})();\n</script>\n")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(single, encoding="utf-8")
print("собрано:", out, len(single), "байт")
