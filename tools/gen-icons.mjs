// Генерация PNG-иконок PWA из public/favicon.svg.
// Запуск: npm i sharp --no-save --no-package-lock && node tools/gen-icons.mjs
// Готовые иконки кладутся в public/icons/ и коммитятся в репозиторий,
// поэтому sharp не нужен на сборке (Vercel) — только для перегенерации.
import sharp from "sharp"
import { mkdirSync } from "node:fs"

const SRC = "public/favicon.svg"
const OUT = "public/icons"
mkdirSync(OUT, { recursive: true })

// высокий density -> чёткая растеризация маленького 64x64 SVG
const density = 1024

async function raster(size, file) {
  await sharp(SRC, { density })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`${OUT}/${file}`)
  console.log("ok", file)
}

// обычные иконки (purpose any) + apple-touch для iOS
await raster(192, "icon-192.png")
await raster(512, "icon-512.png")
await raster(180, "apple-touch-icon-180.png")

// maskable: контент с запасом по краям (safe zone ~80%), фон во весь квадрат
const inner = Math.round(512 * 0.78)
const innerBuf = await sharp(SRC, { density })
  .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 10, g: 0, b: 0, alpha: 1 },
  },
})
  .composite([{ input: innerBuf, gravity: "center" }])
  .png()
  .toFile(`${OUT}/icon-512-maskable.png`)
console.log("ok icon-512-maskable.png")
