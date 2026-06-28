import Phaser from "phaser"

export interface MenuButtonOptions {
  width?: number
  height?: number
  fontSize?: number
  fill?: number
  fillHover?: number
  stroke?: number
  textColor?: string
  depth?: number
  scrollFactor0?: boolean
  onClick: () => void
}

// Стилизованная кнопка меню: рамка, подсветка/масштаб при наведении,
// «нажатие» с лёгким сжатием и звуком клика. Кликабельная зона чуть больше
// самой кнопки — так удобнее попадать пальцем на телефоне.
export function makeMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: MenuButtonOptions
): Phaser.GameObjects.Container {
  const w = opts.width ?? 380
  const h = opts.height ?? 66
  const fill = opts.fill ?? 0x7a0000
  const fillHover = opts.fillHover ?? 0xb00000
  const stroke = opts.stroke ?? 0xff5555
  const pad = 14 // запас зоны нажатия вокруг кнопки

  const shadow = scene.add.rectangle(0, 6, w, h, 0x000000, 0.55)
  const bg = scene.add.rectangle(0, 0, w, h, fill).setStrokeStyle(3, stroke, 0.9)
  const sheen = scene.add.rectangle(0, -h / 2 + 5, w - 10, 5, 0xffffff, 0.14)
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: `${opts.fontSize ?? 30}px`,
      color: opts.textColor ?? "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5)

  const c = scene.add.container(x, y, [shadow, bg, sheen, txt]).setSize(w, h)
  if (opts.scrollFactor0) c.setScrollFactor(0)
  if (opts.depth != null) c.setDepth(opts.depth)

  // Делаем интерактивным сам контейнер (чтобы можно было включать/выключать
  // через c.input.enabled), зона нажатия с запасом по краям.
  c.setInteractive(
    new Phaser.Geom.Rectangle(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2),
    Phaser.Geom.Rectangle.Contains
  )
  if (c.input) c.input.cursor = "pointer"

  const enter = () => {
    bg.setFillStyle(fillHover)
    scene.tweens.add({
      targets: c,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 110,
      ease: "Quad.easeOut",
    })
  }
  const leave = () => {
    bg.setFillStyle(fill)
    scene.tweens.add({
      targets: c,
      scaleX: 1,
      scaleY: 1,
      duration: 110,
      ease: "Quad.easeOut",
    })
  }

  c.on("pointerover", enter)
  c.on("pointerout", leave)
  c.on("pointerdown", () => {
    scene.tweens.add({
      targets: c,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 70,
      yoyo: true,
    })
    try {
      scene.sound.play("click", { volume: 0.5 })
    } catch {
      // звук может быть ещё не разблокирован браузером — не критично
    }
    opts.onClick()
  })

  return c
}
