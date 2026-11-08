#!/usr/bin/env python3
"""Verificador do site estático do DinoMod.

Confere, sem depender de nada além da biblioteca padrão:

  1. todo arquivo referenciado por `index.html`, `404.html`, `favicon.js`,
     `fullscreen.js` e `assets/*.js` existe no repositorio;
  2. todo screenshot referenciado pelo `README.md` existe;
  3. as coordenadas `hdpi` do motor batem com o tamanho real da folha 2x
     (foi exatamente esse o bug que achatou o dino em telas retina);
  4. nenhum modulo ES do `index.html` e carregado com a mesma URL duas vezes
     (duplicar React quebra o jogo com "Invalid hook call").

Uso:  python3 scripts/verify_site.py
Sai com codigo 1 se algo estiver errado.
"""

from __future__ import annotations

import base64
import os
import re
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Extensoes que valem como "recurso do site".
ASSET_EXT = (".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".mp3", ".wav", ".ico", ".html", ".json")

errors: list[str] = []
notes: list[str] = []


def rel(path: str) -> str:
    return os.path.relpath(path, ROOT)


def read(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return fh.read()


def png_size(data: bytes) -> tuple[int, int] | None:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])


def embedded_png(path: str) -> bytes | None:
    """Se o arquivo for um SVG com PNG embutido em base64, devolve o PNG."""
    if not path.lower().endswith(".svg"):
        return None
    try:
        blob = open(path, "rb").read()
    except OSError:
        return None
    match = re.search(rb"data:image/png;base64,([A-Za-z0-9+/=]+)", blob)
    if not match:
        return None
    return base64.b64decode(match.group(1))


def check_references(text: str, source: str) -> None:
    """Acha URLs de recursos locais citados no texto e confere se existem."""
    # src="..."  href="..."  url(...)  import ... from "..."
    patterns = [
        r'(?:src|href)\s*=\s*["\']([^"\']+)["\']',
        r'url\(\s*["\']?([^)"\']+)["\']?\s*\)',
        r'(?:from|import)\s+["\']([^"\']+)["\']',
    ]
    for pattern in patterns:
        for raw in re.findall(pattern, text):
            ref = raw.split("?")[0].split("#")[0].strip()
            if not ref or ref.startswith(("http://", "https://", "//", "data:", "#", "mailto:")):
                continue
            if not ref.lower().endswith(ASSET_EXT):
                continue
            target = os.path.normpath(os.path.join(ROOT, ref))
            if not os.path.isfile(target):
                errors.append(f"{source}: arquivo referenciado nao existe -> {ref}")


def check_readme_images() -> None:
    readme = os.path.join(ROOT, "README.md")
    if not os.path.isfile(readme):
        errors.append("README.md nao encontrado")
        return
    text = read(readme)
    for image in re.findall(r'!\[[^\]]*\]\(([^)]+)\)', text):
        ref = image.split("?")[0].split("#")[0].strip()
        if not ref or ref.startswith(("http://", "https://", "//", "data:")):
            continue
        target = os.path.normpath(os.path.join(ROOT, ref))
        if not os.path.isfile(target):
            errors.append(f"README.md: imagem referenciada nao existe -> {ref}")
    total = len(re.findall(r'!\[[^\]]*\]\(([^)]+)\)', text))
    notes.append(f"README.md: {total} imagens referenciadas, todas conferidas")


def check_unique_module_urls() -> None:
    """O mesmo modulo ES carregado com duas URLs distintas => duas copias
    do React => 'Invalid hook call'. A mesma URL duas vezes e desperdicio
    (o browser deduplica, mas o HTML fica inconsistente)."""
    index = os.path.join(ROOT, "index.html")
    if not os.path.isfile(index):
        errors.append("index.html nao encontrado")
        return
    text = read(index)
    scripts = re.findall(r'<script[^>]+type\s*=\s*["\']module["\'][^>]*src\s*=\s*["\']([^"\']+)["\']', text)
    preloads = re.findall(r'<link[^>]+rel\s*=\s*["\']modulepreload["\'][^>]*href\s*=\s*["\']([^"\']+)["\']', text)
    urls = scripts + preloads

    # Preload + <script> do MESMO modulo e o padrao correto do Vite/TanStack
    # Router; o que nao pode e o mesmo modulo aparecer duas vezes na mesma
    # categoria, nem com query strings diferentes (duplica o React).
    for label, group in (("script", scripts), ("modulepreload", preloads)):
        counts: dict[str, int] = {}
        for url in group:
            counts[url] = counts.get(url, 0) + 1
        for url, count in counts.items():
            if count > 1:
                errors.append(f"index.html: {label} repetido {count}x -> {url}")

    for url in set(urls):
        if "?" in url:
            errors.append(f"index.html: modulo com query string (duplica o React) -> {url}")

    if urls:
        notes.append(
            f"index.html: {len(scripts)} modulos ES + {len(preloads)} modulepreload, "
            f"{len(set(urls))} URLs distintas"
        )


def check_sprite_geometry() -> None:
    """Confere se a folha 2x tem o layout esperado e se as coordenadas `hdpi`
    do motor cabem dentro dela."""
    svg_path = os.path.join(ROOT, "dino", "sprite-2x-v2.svg")
    png_path = os.path.join(ROOT, "dino", "sprite-2x-v2.png")
    engine_path = os.path.join(ROOT, "assets", "engine-_K4YV0Me.js")

    if os.path.isfile(png_path):
        sheet_path = png_path
        blob = open(png_path, "rb").read()
    elif os.path.isfile(svg_path):
        sheet_path = svg_path
        blob = embedded_png(svg_path)
        if blob is None:
            errors.append(f"{rel(svg_path)} nao tem um PNG embutido em base64")
            return
    else:
        errors.append("dino/sprite-2x-v2.svg nao encontrado")
        return

    if not os.path.isfile(engine_path):
        errors.append("assets/engine-_K4YV0Me.js nao encontrado")
        return

    size = png_size(blob)
    if not size:
        errors.append(f"{rel(sheet_path)}: o PNG embutido nao e valido")
        return

    width, height = size
    if (width, height) != (2466, 200):
        errors.append(
            f"{rel(sheet_path)} tem {width}x{height}, esperado 2466x200 "
            "(a folha 2x precisa ter o dobro da 1x, com o mesmo layout)"
        )
    else:
        notes.append(f"{rel(sheet_path)}: PNG embutido de {width}x{height} (2x do 1x, layout correto)")

    engine = read(engine_path)
    start = engine.find("hdpi:{")
    if start == -1:
        errors.append("assets/engine-_K4YV0Me.js: tabela 'hdpi' nao encontrada")
        return
    # Recorta o objeto 'hdpi' equilibrando as chaves.
    depth = 0
    end = start
    for pos in range(start + len("hdpi:"), len(engine)):
        if engine[pos] == "{":
            depth += 1
        elif engine[pos] == "}":
            depth -= 1
            if depth == 0:
                end = pos
                break
    segment = engine[start:end + 1]

    found = 0
    for name, x, y in re.findall(r"(\w+):\{x:(\d+),y:(\d+)\}", segment):
        found += 1
        x, y = int(x), int(y)
        if x >= width or y >= height:
            errors.append(
                f"assets/engine-_K4YV0Me.js: sprite '{name}' em ({x},{y}) esta fora "
                f"da folha 2x ({width}x{height})"
            )
    if found:
        notes.append(f"assets/engine-_K4YV0Me.js: {found} sprites 'hdpi' dentro dos limites")
    else:
        errors.append("assets/engine-_K4YV0Me.js: nenhum sprite encontrado na tabela 'hdpi'")


def check_structure() -> None:
    required = [
        "index.html",
        "404.html",
        ".nojekyll",
        "favicon.js",
        "favicon.svg",
        "apple-touch-icon.svg",
        "fullscreen.js",
        "README.md",
        "CHANGELOG.md",
        "LICENSE",
        "CONTRIBUTING.md",
        "dino/sprite-1x.png",
        "dino/sprite-2x-v2.svg",
        "mods/final-trex-gigante.js",
        "assets/engine-_K4YV0Me.js",
        "assets/routes-a600ZoZK.js",
        "assets/batalha-B9bTLxU3.js",
        "assets/index-DX1qfN7c.js",
    ]
    for path in required:
        if not os.path.isfile(os.path.join(ROOT, path)):
            errors.append(f"falta no repositorio: {path}")
    if not os.path.isdir(os.path.join(ROOT, "docs", "screenshots")):
        errors.append("falta no repositorio: docs/screenshots/")


def check_svg_assets() -> None:
    """Todo SVG de asset precisa ser um XML valido com um PNG embutido."""
    checked = 0
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        if "/.git" in dirpath:
            continue
        for name in filenames:
            if not name.endswith(".svg"):
                continue
            path = os.path.join(dirpath, name)
            rel_path = rel(path)
            try:
                import xml.dom.minidom
                xml.dom.minidom.parse(path)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{rel_path}: SVG invalido ({exc})")
                continue
            if embedded_png(path) is None:
                errors.append(f"{rel_path}: SVG sem PNG embutido em base64")
                continue
            checked += 1
    if checked:
        notes.append(f"{checked} SVG(s) de asset validos com PNG embutido")


def check_obsolete_files() -> None:
    """Arquivos que quebraram o site antes e nao devem voltar."""
    forbidden = [
        "favicon-sync.js",           # dependia de um evento que o motor nunca emitiu
        "dino/sprite-2x.png",        # folha 2x com o layout errado (2048x162)
    ]
    for path in forbidden:
        if os.path.exists(os.path.join(ROOT, path)):
            errors.append(f"arquivo obsoleto presente (ja causou bug): {path}")


def main() -> int:
    for path in ("index.html", "404.html", "favicon.js", "fullscreen.js"):
        full = os.path.join(ROOT, path)
        if os.path.isfile(full):
            check_references(read(full), path)

    assets_dir = os.path.join(ROOT, "assets")
    if os.path.isdir(assets_dir):
        for name in sorted(os.listdir(assets_dir)):
            if name.endswith(".js"):
                check_references(read(os.path.join(assets_dir, name)), f"assets/{name}")

    check_readme_images()
    check_unique_module_urls()
    check_sprite_geometry()
    check_structure()
    check_svg_assets()
    check_obsolete_files()

    for note in notes:
        print(f"  ok  {note}")
    if errors:
        print()
        for error in errors:
            print(f"  ERRO  {error}")
        print(f"\n{len(errors)} problema(s) encontrado(s).")
        return 1
    print("\nTudo certo: o site esta integro.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
