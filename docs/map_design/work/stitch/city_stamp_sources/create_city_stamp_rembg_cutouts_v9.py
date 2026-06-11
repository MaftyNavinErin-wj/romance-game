from pathlib import Path

from PIL import Image, ImageDraw
from rembg import new_session, remove


BASE = Path(__file__).resolve().parent

SOURCES = [
    {
        "kind": "primary_large",
        "input": "t06_city_stamp_source_v1_primary_large.png",
        "output": "t06_city_stamp_source_v1_primary_large_cutout_rembg_u2netp_v9.png",
        "preview": "t06_city_stamp_source_v1_primary_large_cutout_rembg_u2netp_v9_preview.png",
        "title": "primary large rembg object cutout v9",
    },
    {
        "kind": "standard_city",
        "input": "t06_city_stamp_source_v1_standard_city.png",
        "output": "t06_city_stamp_source_v1_standard_city_cutout_rembg_u2netp_v9.png",
        "preview": "t06_city_stamp_source_v1_standard_city_cutout_rembg_u2netp_v9_preview.png",
        "title": "standard city rembg object cutout v9",
    },
    {
        "kind": "subdued_context",
        "input": "t06_city_stamp_source_v1_subdued_context.png",
        "output": "t06_city_stamp_source_v1_subdued_context_cutout_rembg_u2netp_v9.png",
        "preview": "t06_city_stamp_source_v1_subdued_context_cutout_rembg_u2netp_v9_preview.png",
        "title": "subdued context rembg object cutout v9",
    },
]


def crop_to_alpha(img, margin=8):
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("empty alpha")
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - margin)
    y0 = max(0, y0 - margin)
    x1 = min(img.width, x1 + margin)
    y1 = min(img.height, y1 + margin)
    return img.crop((x0, y0, x1, y1)), (x0, y0, x1, y1)


def checkerboard(size, cell=32):
    w, h = size
    bg = Image.new("RGB", size, (242, 235, 210))
    draw = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if ((x // cell) + (y // cell)) % 2 == 0:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(218, 211, 190))
    return bg


def build_preview(cutout, bbox, target):
    preview = checkerboard((1200, 760))
    draw = ImageDraw.Draw(preview)
    draw.text((30, 24), target["title"], fill=(35, 31, 24))
    scale = min(1080 / cutout.width, 620 / cutout.height)
    shown = cutout.resize((int(cutout.width * scale), int(cutout.height * scale)), Image.Resampling.LANCZOS)
    preview.paste(shown, (60, 80), shown)
    draw.text(
        (30, 710),
        f"transparent PNG: {cutout.width} x {cutout.height}; source bbox={bbox}; rembg u2netp alpha matting",
        fill=(35, 31, 24),
    )
    preview.save(BASE / target["preview"])


def cutout_one(target, session):
    src = Image.open(BASE / target["input"]).convert("RGBA")
    cut = remove(
        src,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=210,
        alpha_matting_background_threshold=18,
        alpha_matting_erode_size=8,
    ).convert("RGBA")
    cut, bbox = crop_to_alpha(cut, margin=8)
    cut.save(BASE / target["output"])
    build_preview(cut, bbox, target)


def main():
    session = new_session("u2netp")
    for target in SOURCES:
        cutout_one(target, session)


if __name__ == "__main__":
    main()
