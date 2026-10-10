#!/usr/bin/env python3
"""公式サイトのヒーロー背景・紹介用のシームレス・ループ動画を生成する。

CSP が `default-src 'self'` のため、動画はすべて自前ホストする前提。
生成するのは装飾目的のミュート ambient 映像（音声トラックなし）で、
各サイトのヒーロー背景や紹介セクションに `<video autoplay muted loop playsinline>`
として埋め込む。すべての動きは 8 秒周期の周期関数で設計し、
ループ端で映像が継ぎ目なくつながる。

生成物（リポジトリにコミットするもの）:
  assets/hero-loop.{mp4,webm} + assets/hero-poster.webp            … MCT ポータル（白）
  mifron/assets/hero-loop.{mp4,webm} + mifron/assets/hero-poster.webp
                                                                    … Mifron スタジオ（濃紺）
  mifron/assets/minecraft-loop.{mp4,webm} + mifron/assets/minecraft-poster.webp
                                                                    … Mifron Minecraft 紹介（緑）
  tatudragon/assets/hero-loop.{mp4,webm} + tatudragon/assets/hero-poster.webp
                                                                    … tatudragon（白＋ローズ）

使い方:
  python3 -m venv .venv-video
  .venv-video/bin/pip install pillow numpy imageio-ffmpeg
  .venv-video/bin/python tools/render_hero_videos.py            # すべて生成
  .venv-video/bin/python tools/render_hero_videos.py --only studio minecraft

必要なければ .venv-video/ は削除してよい（生成物はスクリプトの出力のみ）。
"""

from __future__ import annotations

import argparse
import io
import math
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

W, H = 1280, 720
FPS = 24
DURATION = 8.0  # 秒。すべての動きはこの周期でループする
FRAMES = int(FPS * DURATION)
TWO_PI = math.pi * 2.0

# よく使う色（0-255 のタプル）
INDIGO = (86, 70, 255)        # --mifron
INDIGO_LIGHT = (139, 123, 255)  # スタジオの --mifron
GREEN = (3, 98, 76)           # --crew
ORANGE = (194, 94, 0)         # --tex
GOLD = (217, 164, 0)          # --gold
GOLD_LIGHT = (245, 208, 111)  # スタジオの --gold
ROSE = (192, 43, 107)         # --dragon
PAPER = (250, 250, 247)       # --paper
INK = (22, 24, 29)            # --ink


def _grid_coords() -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[0:H, 0:W]
    return yy.astype(np.float64), xx.astype(np.float64)


_YY, _XX = _grid_coords()


def vertical_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> np.ndarray:
    """上から下への線形グラデーション（H x W x 3, float64）。"""
    t = np.linspace(0.0, 1.0, H)[:, None]
    col = np.asarray(top, dtype=np.float64) * (1.0 - t) + np.asarray(bottom, dtype=np.float64) * t
    return np.broadcast_to(col[:, None, :], (H, W, 3)).copy()


def add_blob(img: np.ndarray, cx: float, cy: float, radius: float,
             color: tuple[int, int, int], intensity: float) -> None:
    """中心 (cx, cy) にガウスぼかしの色玉をアルファ合成する（明暗どちらの下地でも見える）。"""
    reach = radius * 3.0
    x0, x1 = max(0, int(cx - reach)), min(W, int(cx + reach))
    y0, y1 = max(0, int(cy - reach)), min(H, int(cy + reach))
    if x0 >= x1 or y0 >= y1:
        return
    d2 = (_XX[y0:y1, x0:x1] - cx) ** 2 + (_YY[y0:y1, x0:x1] - cy) ** 2
    alpha = intensity * np.exp(-d2 / (2.0 * radius * radius))
    region = img[y0:y1, x0:x1]
    img[y0:y1, x0:x1] = (region * (1.0 - alpha[:, :, None])
                          + np.asarray(color, dtype=np.float64) * alpha[:, :, None])


def make_vignette(strength: float) -> np.ndarray:
    """中央を明るく・四隅を暗くする静的な減光マスク（H x W）。"""
    cx, cy = W / 2.0, H / 2.0
    d = np.sqrt((_XX - cx) ** 2 + (_YY - cy) ** 2) / math.hypot(cx, cy)
    return 1.0 - strength * np.clip(d - 0.55, 0.0, 1.0) ** 1.5


def make_grid(cell: int, color: tuple[int, int, int], alpha: float) -> np.ndarray:
    """セル状のグリッド線（後で np.roll で動かす）。"""
    img = np.zeros((H, W, 3), dtype=np.float64)
    for x in range(0, W, cell):
        img[:, x] = color
    for y in range(0, H, cell):
        img[y, :] = color
    return img * alpha


@dataclass
class Dot:
    """上に漂う小さな粒子。speed は H の整数倍 / T に量子化する（ループの継ぎ目を消す）。"""
    x: float
    y: float
    speed: float
    radius: float
    color: tuple[int, int, int]
    alpha: int
    phase: float
    sway: float

    def draw(self, draw: ImageDraw.ImageDraw, t: float) -> None:
        y = (self.y - self.speed * t) % H
        x = (self.x + self.sway * math.sin(TWO_PI * t / DURATION + self.phase)) % W
        r = self.radius * (0.75 + 0.25 * math.sin(TWO_PI * t / DURATION + self.phase))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=self.color + (self.alpha,))


@dataclass
class Voxel:
    """Minecraft らしい小さな立方体（軸に沿った正方形）。"""
    x: float
    y: float
    speed: float
    half: float
    color: tuple[int, int, int]
    alpha: int
    phase: float

    def draw(self, draw: ImageDraw.ImageDraw, t: float) -> None:
        y = (self.y - self.speed * t) % H
        x = (self.x + 14.0 * math.sin(TWO_PI * t / DURATION + self.phase)) % W
        s = self.half * (0.85 + 0.15 * math.sin(TWO_PI * t / DURATION + self.phase))
        edge = tuple(min(255, c + 46) for c in self.color)
        draw.rectangle([x - s, y - s, x + s, y + s], fill=self.color + (self.alpha,),
                       outline=edge + (min(255, self.alpha + 40),))


def dots_from_rng(rng: np.random.Generator, count: int, colors: list[tuple[int, int, int]],
                  radius_range: tuple[float, float], alpha_range: tuple[int, int],
                  speed_range: tuple[int, int] = (1, 1)) -> list[Dot]:
    dots = []
    for _ in range(count):
        speed = rng.integers(speed_range[0], speed_range[1] + 1) * H / DURATION
        dots.append(Dot(
            x=float(rng.uniform(0, W)),
            y=float(rng.uniform(0, H)),
            speed=float(speed),
            radius=float(rng.uniform(*radius_range)),
            color=colors[int(rng.integers(0, len(colors)))],
            alpha=int(rng.integers(*alpha_range)),
            phase=float(rng.uniform(0, TWO_PI)),
            sway=float(rng.uniform(6, 26)),
        ))
    return dots


def voxels_from_rng(rng: np.random.Generator, count: int,
                    colors: list[tuple[int, int, int]],
                    half_range: tuple[float, float], alpha_range: tuple[int, int]) -> list[Voxel]:
    voxels = []
    for _ in range(count):
        speed = float(rng.integers(1, 3)) * H / DURATION
        voxels.append(Voxel(
            x=float(rng.uniform(0, W)),
            y=float(rng.uniform(0, H)),
            speed=speed,
            half=float(rng.uniform(*half_range)),
            color=colors[int(rng.integers(0, len(colors)))],
            alpha=int(rng.integers(*alpha_range)),
            phase=float(rng.uniform(0, TWO_PI)),
        ))
    return voxels


class Recipe:
    """1 フレーム分のレンダリング手順。t は 0 <= t < DURATION の周期で与える。"""

    def __init__(self, name: str, seed: int):
        self.name = name
        self.rng = np.random.default_rng(seed)
        self.vignette = make_vignette(0.30)
        self.noise = self.rng.integers(-2, 3, size=(H, W, 1)).astype(np.int16)

    def base(self) -> np.ndarray:
        raise NotImplementedError

    def decorate(self, img: np.ndarray, t: float) -> None:
        """グリッドや光の玉などフレーム単位の下地効果。"""

    def draw_overlay(self, draw: ImageDraw.ImageDraw, t: float) -> None:
        """粒子・ボクセルなどの前面レイヤー。"""

    def render(self, t: float) -> np.ndarray:
        img = self.base()
        self.decorate(img, t)
        overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        self.draw_overlay(draw, t)
        ov = np.asarray(overlay, dtype=np.float64)
        alpha = ov[:, :, 3:4] / 255.0
        img = img * (1.0 - alpha) + ov[:, :, :3] * alpha
        img *= self.vignette[:, :, None]
        img += self.noise
        return np.clip(img, 0, 255).astype(np.uint8)


class PortalRecipe(Recipe):
    """MCT ポータル: 白ベースに淡いブランド色の光。"""

    def __init__(self):
        super().__init__('portal', seed=20261001)
        self._base = vertical_gradient(PAPER, (241, 241, 236))
        self.dots = dots_from_rng(
            self.rng, 46, [INDIGO, GREEN, ORANGE, GOLD],
            radius_range=(2.0, 5.0), alpha_range=(36, 90))

    def base(self):
        return self._base.copy()

    def decorate(self, img, t):
        u = TWO_PI * t / DURATION
        add_blob(img, W * 0.20 + 90 * math.sin(u), H * 0.28 + 60 * math.sin(2 * u + 1.2),
                 250, INDIGO, 0.11)
        add_blob(img, W * 0.82 + 80 * math.sin(u + 2.1), H * 0.72 + 50 * math.sin(2 * u + 0.4),
                 290, GREEN, 0.09)
        add_blob(img, W * 0.55 + 70 * math.sin(u + 4.0), H * 0.12 + 40 * math.sin(2 * u + 2.6),
                 210, ORANGE, 0.08)
        add_blob(img, W * 0.42, H * 0.55, 180, GOLD, 0.06)

    def draw_overlay(self, draw, t):
        for dot in self.dots:
            dot.draw(draw, t)


class StudioRecipe(Recipe):
    """Mifron スタジオ: 濃紺ベースにインディゴと金色の光、薄いグリッド。"""

    def __init__(self):
        super().__init__('studio', seed=20261002)
        self._base = vertical_gradient((11, 12, 16), (22, 24, 32))
        self.grid = make_grid(80, (139, 123, 255), 0.05)
        self.dots = dots_from_rng(
            self.rng, 60, [INDIGO_LIGHT, GOLD_LIGHT, (200, 205, 230)],
            radius_range=(1.6, 4.2), alpha_range=(50, 130))

    def base(self):
        return self._base.copy()

    def decorate(self, img, t):
        u = TWO_PI * t / DURATION
        # グリッドをゆっくり対角に流す（8秒で80px = 1セル分進むのでループで継ぎ目が出ない）
        shift = int(round(10.0 * t)) % 80
        img += np.roll(self.grid, shift=(shift, shift), axis=(1, 0))
        add_blob(img, W * 0.24 + 110 * math.sin(u + 0.7), H * 0.30 + 70 * math.sin(2 * u),
                 300, INDIGO_LIGHT, 0.20)
        add_blob(img, W * 0.78 + 90 * math.sin(u + 2.8), H * 0.70 + 60 * math.sin(2 * u + 1.1),
                 260, INDIGO, 0.16)
        add_blob(img, W * 0.55 + 60 * math.sin(u + 4.4), H * 0.85 + 30 * math.sin(2 * u + 2.2),
                 220, GOLD_LIGHT, 0.13)

    def draw_overlay(self, draw, t):
        for dot in self.dots:
            dot.draw(draw, t)


class MinecraftRecipe(Recipe):
    """Mifron Minecraft: 深い緑の霧の中を漂うボクセルと淡い光。"""

    def __init__(self):
        super().__init__('minecraft', seed=20261003)
        self._base = vertical_gradient((10, 22, 15), (18, 42, 28))
        self.dots = dots_from_rng(
            self.rng, 34, [(143, 211, 107), (245, 208, 111), (216, 232, 208)],
            radius_range=(1.4, 3.2), alpha_range=(40, 110))
        self.voxels = voxels_from_rng(
            self.rng, 26, [(47, 122, 74), (29, 59, 42), (143, 211, 107), (245, 208, 111)],
            half_range=(6.0, 20.0), alpha_range=(110, 210))

    def base(self):
        return self._base.copy()

    def decorate(self, img, t):
        u = TWO_PI * t / DURATION
        add_blob(img, W * 0.5, H * 1.05 + 20 * math.sin(u), 340, (47, 122, 74), 0.30)
        add_blob(img, W * 0.15 + 60 * math.sin(u + 1.3), H * 0.25, 240, (29, 59, 42), 0.20)
        add_blob(img, W * 0.85 + 60 * math.sin(u + 3.9), H * 0.55, 200, (245, 208, 111), 0.10)
        add_blob(img, W * 0.62, H * 0.18, 180, (143, 211, 107), 0.08)

    def draw_overlay(self, draw, t):
        for voxel in self.voxels:
            voxel.draw(draw, t)
        for dot in self.dots:
            dot.draw(draw, t)


class TatudragonRecipe(Recipe):
    """tatudragon: 白ベースにローズのアクセント。落ち着いたトーン。"""

    def __init__(self):
        super().__init__('tatudragon', seed=20261004)
        self._base = vertical_gradient(PAPER, (248, 244, 240))
        self.dots = dots_from_rng(
            self.rng, 40, [ROSE, (192, 43, 107), (217, 164, 0)],
            radius_range=(1.8, 4.4), alpha_range=(30, 80))

    def base(self):
        return self._base.copy()

    def decorate(self, img, t):
        u = TWO_PI * t / DURATION
        add_blob(img, W * 0.18 + 80 * math.sin(u + 0.9), H * 0.30 + 55 * math.sin(2 * u),
                 240, ROSE, 0.10)
        add_blob(img, W * 0.84 + 70 * math.sin(u + 2.4), H * 0.68 + 55 * math.sin(2 * u + 1.7),
                 260, ROSE, 0.075)
        add_blob(img, W * 0.55, H * 0.15, 190, GOLD, 0.05)

    def draw_overlay(self, draw, t):
        for dot in self.dots:
            dot.draw(draw, t)


# 出力定義: (キー, レシピ, 出力ディレクトリ, ベース名)
SPECS = [
    ('portal', PortalRecipe, ROOT / 'assets', 'hero'),
    ('studio', StudioRecipe, ROOT / 'mifron' / 'assets', 'hero'),
    ('minecraft', MinecraftRecipe, ROOT / 'mifron' / 'assets', 'minecraft'),
    ('tatudragon', TatudragonRecipe, ROOT / 'tatudragon' / 'assets', 'hero'),
]

MP4_ARGS = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '26',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
WEBM_ARGS = ['-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1',
             '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p']


def find_ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        import shutil
        exe = shutil.which('ffmpeg')
        if not exe:
            sys.exit('ffmpeg が見つかりません。imageio-ffmpeg をインストールするか ffmpeg を PATH に通してください。')
        return exe


def encode(frames_png: list[bytes], out_path: Path, codec_args: list[str], ffmpeg: str) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [ffmpeg, '-y',
           '-f', 'image2pipe', '-vcodec', 'png', '-r', str(FPS), '-i', '-',
           '-an'] + codec_args + [str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    assert proc.stdin is not None
    for chunk in frames_png:
        proc.stdin.write(chunk)
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        sys.exit(f'ffmpeg のエンコードに失敗しました: {out_path}')


def png_bytes(frame: np.ndarray) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(frame, 'RGB').save(buf, format='PNG', optimize=True)
    return buf.getvalue()


def build(key: str, recipe: Recipe, out_dir: Path, base_name: str, ffmpeg: str) -> None:
    print(f'[{key}] レンダリング中 {W}x{H} / {FPS}fps / {DURATION:.0f}s ({FRAMES}フレーム) ...')
    frames_png: list[bytes] = []
    poster_frame: np.ndarray | None = None
    for i in range(FRAMES):
        t = i / FPS
        frame = recipe.render(t)
        if i == 0:
            poster_frame = frame
        frames_png.append(png_bytes(frame))
        if (i + 1) % 48 == 0:
            print(f'  {i + 1}/{FRAMES} フレーム')

    assert poster_frame is not None
    poster_path = out_dir / f'{base_name}-poster.webp'
    poster_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(poster_frame, 'RGB').save(poster_path, 'WEBP', quality=82, method=4)

    mp4_path = out_dir / f'{base_name}-loop.mp4'
    webm_path = out_dir / f'{base_name}-loop.webm'
    print(f'[{key}] エンコード中: {mp4_path.relative_to(ROOT)}')
    encode(frames_png, mp4_path, MP4_ARGS, ffmpeg)
    print(f'[{key}] エンコード中: {webm_path.relative_to(ROOT)}')
    encode(frames_png, webm_path, WEBM_ARGS, ffmpeg)

    for path in (poster_path, mp4_path, webm_path):
        print(f'  -> {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.0f} KB)')


def main() -> None:
    parser = argparse.ArgumentParser(description='ヒーロー用ループ動画を生成する')
    parser.add_argument('--only', nargs='*', choices=[s[0] for s in SPECS], default=None,
                        help='生成する動画を絞り込む（既定: すべて）')
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    for key, recipe_cls, out_dir, base_name in SPECS:
        if args.only and key not in args.only:
            continue
        build(key, recipe_cls(), out_dir, base_name, ffmpeg)
    print('完了しました。')


if __name__ == '__main__':
    main()
