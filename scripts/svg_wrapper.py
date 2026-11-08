#!/usr/bin/env python3
"""Converte PNGs em SVG que carregam o PNG original embutido em base64.

Por que isso existe
-------------------
O repositório é publicado direto no GitHub Pages e o formato de origem dos
assets é PNG (sprites, ícones e screenshots). A API de escrita do GitHub
aceita apenas texto UTF-8, então um PNG binário não pode ser gravado
diretamente pelo fluxo automatizado de publicação.

A saída é um SVG de uma linha de imagem que carrega o PNG intacto em base64:

    <image href="data:image/png;base64,..."/>

Navegadores renderizam isso em <img> e em drawImage() exatamente como o PNG
original — os pixels saem idênticos, inclusive no recorte por retângulo de
fonte que o motor do jogo usa na folha de sprites.

Uso
----
    # PNG  -> SVG
    python3 scripts/svg_wrapper.py dino/sprite-2x-v2.png dino/sprite-2x-v2.svg

    # SVG  -> PNG (recupera o arquivo original)
    python3 scripts/svg_wrapper.py --extract dino/sprite-2x-v2.svg sprite-2x-v2.png
"""

from __future__ import annotations

import argparse
import base64
import os
import re
import sys

TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<!--
  {name} — PNG de {width}x{height} embutido em base64.
  Gerado por scripts/svg_wrapper.py. Use a opcao "extract" para recuperar o PNG original.
-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}" preserveAspectRatio="none">
  <image x="0" y="0" width="{width}" height="{height}" preserveAspectRatio="none" xlink:href="data:image/png;base64,{data}" href="data:image/png;base64,{data}"/>
</svg>
"""

PNG_RE = re.compile(rb"data:image/png;base64,([A-Za-z0-9+/=]+)")


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("nao e um PNG")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def to_svg(src: str, dst: str) -> None:
    raw = open(src, "rb").read()
    width, height = png_size(raw)
    encoded = base64.b64encode(raw).decode("ascii")
    body = TEMPLATE.format(
        name=os.path.basename(src),
        width=width,
        height=height,
        data=encoded,
    )
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(body)
    print(f"  {dst}  ({width}x{height}, {len(raw)} bytes de PNG embutidos)")


def extract(src: str, dst: str) -> None:
    match = PNG_RE.search(open(src, "rb").read())
    if not match:
        raise ValueError(f"{src} nao tem um PNG embutido")
    raw = base64.b64decode(match.group(1))
    with open(dst, "wb") as fh:
        fh.write(raw)
    print(f"  {dst}  ({len(raw)} bytes extraidos)")


def main() -> int:
    parser = argparse.ArgumentParser(description="PNG <-> SVG com base64 embutido")
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("--extract", action="store_true", help="extrai o PNG do SVG")
    args = parser.parse_args()

    try:
        if args.extract:
            extract(args.source, args.target)
        else:
            to_svg(args.source, args.target)
    except (OSError, ValueError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
