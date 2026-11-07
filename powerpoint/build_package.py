from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import shutil, zipfile

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
ASSETS = OUT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# Sprite sheet already stored in the repository, from the Chrome Dino project.
sheet_path = ROOT.parent / "dino" / "sprite-1x.png"
sheet = Image.open(sheet_path).convert("RGBA")
# Source rectangles are pixel coordinates in the original Chrome Dino sprite atlas.
for name, rect in {
    "dino-run-1.png": (936, 2, 980, 49),
    "dino-run-2.png": (980, 2, 1024, 49),
    "dino-jump.png": (848, 2, 892, 49),
    "dino-duck.png": (1112, 2, 1171, 27),
}.items():
    sheet.crop(rect).save(ASSETS / name)
shutil.copy2(sheet_path, ASSETS / "chrome-dino-original-sprite-sheet.png")
shutil.copy2(ROOT / "ChromeDinoGame.bas", OUT / "ChromeDinoGame.bas")

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = RGBColor(250, 250, 250)

heading = slide.shapes.add_textbox(Inches(.6), Inches(.35), Inches(12), Inches(.65))
p = heading.text_frame.paragraphs[0]
p.text = "CHROME DINO"
p.font.name, p.font.size, p.font.bold = "Arial", Pt(28), True
p.font.color.rgb = RGBColor(83, 83, 83)

hint = slide.shapes.add_textbox(Inches(.65), Inches(1.05), Inches(12), Inches(.4))
p = hint.text_frame.paragraphs[0]
p.text = "Pressione ESPAÇO ou ↑ para pular  •  ↓ para agachar  •  R para reiniciar"
p.font.name, p.font.size = "Arial", Pt(14)
p.font.color.rgb = RGBColor(100, 100, 100)

field = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(.45), Inches(1.7), Inches(12.4), Inches(5.25))
field.fill.solid()
field.fill.fore_color.rgb = RGBColor(255, 255, 255)
field.line.color.rgb = RGBColor(225, 225, 225)

center = slide.shapes.add_textbox(Inches(1), Inches(3.5), Inches(11.3), Inches(.8))
p = center.text_frame.paragraphs[0]
p.text = "CHROME DINO  •  IMPORTE A MACRO PARA INICIAR"
p.alignment = PP_ALIGN.CENTER
p.font.name, p.font.size, p.font.bold = "Arial", Pt(20), True
p.font.color.rgb = RGBColor(83, 83, 83)

prs.save(OUT / "Chrome_Dino_PowerPoint_Base.pptx")
readme = ROOT / "LEIA-ME.md"
shutil.copy2(readme, OUT / "LEIA-ME.md")
zip_path = OUT / "Chrome_Dino_PowerPoint_Pacote.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for f in OUT.rglob("*"):
        if f.is_file() and f != zip_path:
            z.write(f, f.relative_to(OUT))
print(f"Pacote pronto: {zip_path}")
