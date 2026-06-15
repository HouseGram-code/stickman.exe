<!-- ╔══════════════════════════════════════════════════════════════╗ -->
<!--                          STICKMAN.EXE                            -->
<!-- ╚══════════════════════════════════════════════════════════════╝ -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,50:7a0000,100:ff0000&height=220&section=header&text=STICKMAN.EXE&fontColor=ff1a1a&fontSize=70&fontAlignY=38&desc=...%D0%BE%D0%BD%20%D1%83%D0%B6%D0%B5%20%D0%B7%D0%B0%20%D1%82%D0%B2%D0%BE%D0%B5%D0%B9%20%D1%81%D0%BF%D0%B8%D0%BD%D0%BE%D0%B9&descAlignY=62&descColor=8b0000" width="100%" />

<a href="https://github.com/HouseGram-code/stickman.exe">
  <img src="https://readme-typing-svg.demolab.com?font=Creepster&size=34&pause=800&color=FF0000&center=true&vCenter=true&width=700&height=70&lines=%D0%9F%D1%80%D0%B5%D0%BA%D1%80%D0%B0%D1%81%D0%BD%D1%8B%D0%B9+%D0%B4%D0%B5%D0%BD%D1%8C...;%D0%92%D1%81%D1%91+%D1%82%D0%B5%D0%BC%D0%BD%D0%B5%D0%B5%D1%82.;%D0%9A%D1%82%D0%BE+%D1%8D%D1%82%D0%BE%D1%82+%D1%87%D1%91%D1%80%D0%BD%D1%8B%D0%B9+%D1%81%D1%82%D0%B8%D0%BA%D0%BC%D0%B5%D0%BD%3F;%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82." alt="typing" />
</a>

<br/>

<!-- ░░ БЕЙДЖИ ░░ -->
<img src="https://img.shields.io/badge/%E2%96%B6_PLAY-version_0.1_beta-ff0000?style=for-the-badge&labelColor=000000" />
<img src="https://img.shields.io/badge/Phaser-3.80-ff1a1a?style=for-the-badge&logo=phaser&logoColor=white&labelColor=000000" />
<img src="https://img.shields.io/badge/TypeScript-5.4-8b0000?style=for-the-badge&logo=typescript&logoColor=white&labelColor=000000" />
<img src="https://img.shields.io/badge/Vite-5.2-7a0000?style=for-the-badge&logo=vite&logoColor=white&labelColor=000000" />

<br/>

<img src="https://img.shields.io/badge/GENRE-HORROR-000000?style=flat-square&labelColor=ff0000" />
<img src="https://img.shields.io/badge/MADE_BY-FANS-000000?style=flat-square&labelColor=ff0000" />
<img src="https://img.shields.io/badge/MOBILE-READY-000000?style=flat-square&labelColor=ff0000" />

</div>

<div align="center">

```
       ████████████████████████████████████████████████████
       █                                                  █
       █     " Прекрасный день → прогулка направо →        █
       █       всё темнеет → появляется кровь →            █
       █       чёрный стикмен → глаза краснеют → Привет. "  █
       █                                                  █
       ████████████████████████████████████████████████████
```

</div>

---

## 🩸 О проекте

> **STICKMAN.EXE** — фанатская хоррор-игра в духе `.exe`-крипипаст, написанная на **Phaser 3 + TypeScript**.
> Начинается всё как милая прогулка под весёлую музыку... но мир постепенно тонет в темноте и крови.
> Ты не убегаешь от монстра. Ты идёшь к нему **сам**.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212744287-26ba2ba8-b1b8-4e8d-9a40-bb96d6d6c98c.gif" width="120" />
</div>

---

## 👁 Особенности

| | |
|---|---|
| 🎭 **Резкая смена тона** | Светлый «счастливый» старт → медленное погружение в хоррор |
| 🩸 **Атмосфера** | Кровь, темнота, хоррор-дрон, сердцебиение и джампскейр |
| 🗣 **Диалоговая система** | Кат-сцены с портретами героя и злодея |
| 🏃 **Несколько режимов** | Прогулка, погоня, босс-битва и бесконечный раннер |
| 🕹 **Выбор персонажа** | Отдельная сцена выбора героя |
| 📱 **Мобильное управление** | Сенсорные кнопки + мультитач (движение и прыжок одновременно) |
| 🎨 **Полностью свои ассеты** | Все спрайты и звуки сгенерированы и заменяемы |

---

## 🎬 Сцены игры

```mermaid
flowchart LR
    A[🥾 Boot] --> B[📜 Menu]
    B --> C[🧍 Character Select]
    C --> D[🌳 Game / Прогулка]
    D --> E[🏃 Chase / Погоня]
    E --> F[⚔️ Battle / Босс]
    F --> G[♾️ Runner]
    style A fill:#000,stroke:#ff0000,color:#ff4d4d
    style B fill:#000,stroke:#ff0000,color:#ff4d4d
    style C fill:#000,stroke:#ff0000,color:#ff4d4d
    style D fill:#1a0000,stroke:#ff0000,color:#ff6666
    style E fill:#330000,stroke:#ff0000,color:#ff6666
    style F fill:#4d0000,stroke:#ff0000,color:#ff8080
    style G fill:#660000,stroke:#ff0000,color:#ffaaaa
```

---

## 🕹 Управление

| Действие | Клавиатура | Мобильные |
|----------|-----------|-----------|
| Движение | `← →` стрелки | сенсорные кнопки |
| Прыжок | `Пробел` / `↑` | кнопка прыжка |
| Пролистать диалог | `Пробел` / `Enter` | тап по экрану |
| Полный экран | `F` | — |

---

## ⚙️ Запуск

```bash
# 1. Установить зависимости
npm install

# 2. Запустить дев-сервер
npm run dev
```

Открой адрес, который покажет Vite (обычно `http://localhost:5173`).

### 🏗 Сборка для сайта

```bash
npm run build
```

Готовая версия появится в папке `dist/` — её можно залить на любой хостинг (GitHub Pages, itch.io, Netlify).

---

## 📁 Структура

```
stickman.exe/
├── assets/              # спрайты и звуки (заменяемые)
├── src/
│   ├── main.ts          # конфиг Phaser и список сцен
│   ├── scenes/          # Boot, Menu, CharacterSelect, Game, Chase, Battle, Runner
│   └── ui/              # Dialog, TouchControls
├── index.html
└── vite.config.ts
```

---

## 🗺 Роадмап / Улучшения

- [x] Базовый цикл: прогулка → хоррор → диалог
- [x] Мобильное управление и мультитач
- [x] Босс-битва и режим раннера
- [ ] 🔊 Регулятор громкости и меню настроек
- [ ] 💾 Сохранение прогресса и достижения
- [ ] 🌐 Полная локализация (RU / EN)
- [ ] 🎞 Больше кат-сцен и развязка сюжета
- [ ] 🏆 Таблица рекордов в режиме раннера
- [ ] 🕹 Поддержка геймпада

---

## ⚠️ Дисклеймер

> Это **некоммерческий фанатский проект**, созданный из любви к жанру `.exe`-хоррора.
> Все ассеты оригинальные/сгенерированы. Не связан с какими-либо правообладателями.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff0000,50:7a0000,100:000000&height=140&section=footer" width="100%" />

**Сделано фанатами. Включи звук. Не оборачивайся.**

<sub>🩸 STICKMAN.EXE — v0.1 beta 🩸</sub>

</div>
