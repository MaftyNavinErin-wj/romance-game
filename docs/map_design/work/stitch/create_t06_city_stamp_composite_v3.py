import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
BASE = ROOT / "terrain_t06_cc_w_no_city_v2_normalized.png"
SOURCE_DIR = ROOT / "city_stamp_sources"
OUT = ROOT / "terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3.png"
PREVIEW = ROOT / "terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_preview.png"


CONCEPT_W = 1672
CONCEPT_H = 941
SVG_W = 960
SVG_H = 740
SX = CONCEPT_W / SVG_W
SY = CONCEPT_H / SVG_H
HEX_SIZE = 6
HEX_H = math.sqrt(3) * HEX_SIZE
CROP = {"x": 334, "y": 251, "w": 586, "h": 439}
OUT_SIZE = {"w": 2344, "h": 1756}


GLOBAL_PRIMARY = {"changan", "luoyang"}
T06_STANDARD = {"nanyang", "xiangyang", "shangyong", "yiling"}
SUBDUED = {"xinye", "hanzhong"}
EAST_CONTEXT = {"chenliu", "guandu", "xuchang"}
RENDER_SET = GLOBAL_PRIMARY | T06_STANDARD | SUBDUED | EAST_CONTEXT

NUDGES = {
    "luoyang": (36, 64),
    "xiangyang": (46, 78),
    "chenliu": (0, 54),
    "guandu": (-8, 54),
    "xuchang": (0, 46),
    "yiling": (-20, 20),
}
STAMP_FIT = {
    "luoyang": (-24, 84),
    "guandu": (-42, 62),
}

SOURCE_FILES = {
    "primary": SOURCE_DIR / "t06_city_stamp_source_v1_primary_large_cutout_rembg_u2netp_v9.png",
    "standard": SOURCE_DIR / "t06_city_stamp_source_v1_standard_city_cutout_rembg_u2netp_v9.png",
    "context": SOURCE_DIR / "t06_city_stamp_source_v1_subdued_context_cutout_rembg_u2netp_v9.png",
}

# Widths are in the normalized 2344 x 1756 frame. They are intentionally close
# to the accepted placeholder reserve sizes, not final runtime sizes.
STAMP_WIDTH = {
    "global-primary": 158,
    "t06-standard": 126,
    "subdued": 98,
    "east-context": 94,
}

STAMP_OPACITY = {
    "global-primary": 0.9,
    "t06-standard": 0.88,
    "subdued": 0.78,
    "east-context": 0.76,
}

LABELS = {
    "changan": "长安",
    "luoyang": "洛阳",
    "nanyang": "南阳",
    "xiangyang": "襄阳",
    "shangyong": "上庸",
    "yiling": "夷陵",
    "xinye": "新野",
    "hanzhong": "汉中",
    "chenliu": "陈留",
    "guandu": "官渡岸上",
    "xuchang": "许昌",
}


def load_city_base():
    path = REPO / "src" / "data" / "city_base.js"
    text = path.read_text(encoding="utf-8")
    match = re.search(r"const\s+CITY_BASE\s*=\s*(\{.*?\});", text, re.S)
    if not match:
        raise RuntimeError("CITY_BASE not found")
    return json.loads(match.group(1))


def hex_to_pixel(q, r):
    x = q * HEX_SIZE * 1.5 + HEX_SIZE + 8
    y = r * HEX_H + (HEX_H / 2 if q % 2 else 0) + HEX_H / 2 + 4
    return {"x": x * SX, "y": y * SY}


def to_output(concept):
    return {
        "x": (concept["x"] - CROP["x"]) / CROP["w"] * OUT_SIZE["w"],
        "y": (concept["y"] - CROP["y"]) / CROP["h"] * OUT_SIZE["h"],
    }


def city_class(city_id):
    if city_id in GLOBAL_PRIMARY:
        return "global-primary"
    if city_id in T06_STANDARD:
        return "t06-standard"
    if city_id in SUBDUED:
        return "subdued"
    if city_id in EAST_CONTEXT:
        return "east-context"
    return "ghost-context"


def source_key(cls):
    if cls == "global-primary":
        return "primary"
    if cls == "t06-standard":
        return "standard"
    return "context"


def apply_opacity(img, opacity):
    out = img.copy()
    alpha = out.getchannel("A").point(lambda a: int(a * opacity))
    out.putalpha(alpha)
    return out


def tint_for_blend(cls):
    if cls == "global-primary":
        return (216, 190, 124, 58)
    if cls == "t06-standard":
        return (198, 184, 136, 50)
    if cls == "east-context":
        return (184, 178, 140, 36)
    return (190, 182, 145, 32)


def soften_source_approach(img, city_id):
    if city_id != "guandu":
        return img

    softened = img.copy()
    cover = Image.new("RGBA", softened.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(cover)
    w, h = softened.size
    draw.ellipse(
        [
            w * 0.34,
            h * 0.56,
            w * 0.88,
            h * 1.08,
        ],
        fill=(202, 190, 148, 82),
    )
    cover = cover.filter(ImageFilter.GaussianBlur(radius=8))
    softened.alpha_composite(cover)
    return softened


def paste_stamp(canvas, stamp, center, cls, city_id):
    target_w = STAMP_WIDTH[cls]
    scale = target_w / stamp.width
    target_h = int(round(stamp.height * scale))
    resized = stamp.resize((target_w, target_h), Image.Resampling.LANCZOS)
    resized = soften_source_approach(resized, city_id)
    resized = apply_opacity(resized, STAMP_OPACITY[cls])

    # Soft local paper pad behind object cutout; it is deterministic and still
    # much smaller than prior oval source screenshots.
    pad = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    pad_draw = ImageDraw.Draw(pad)
    pad_color = tint_for_blend(cls)
    rx = target_w * (0.62 if cls == "global-primary" else 0.58)
    ry = target_h * 0.38
    pad_draw.ellipse(
        [
            center["x"] - rx,
            center["y"] - ry * 0.15,
            center["x"] + rx,
            center["y"] + ry * 1.05,
        ],
        fill=pad_color,
    )
    pad = pad.filter(ImageFilter.GaussianBlur(radius=18 if cls == "global-primary" else 13))
    canvas.alpha_composite(pad)

    x = int(round(center["x"] - target_w / 2))
    y = int(round(center["y"] - target_h / 2))
    canvas.alpha_composite(resized, dest=(x, y))
    return {"x": x, "y": y, "w": target_w, "h": target_h}


def draw_review_overlay(img, placements):
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 28)
        small = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 22)
    except OSError:
        font = ImageFont.load_default()
        small = ImageFont.load_default()

    for item in placements:
        x = item["center"]["x"]
        y = item["center"]["y"]
        cls = item["class"]
        color = {
            "global-primary": (255, 190, 72, 210),
            "t06-standard": (97, 219, 232, 210),
            "subdued": (196, 142, 255, 190),
            "east-context": (255, 139, 104, 190),
        }[cls]
        r = 8 if cls == "global-primary" else 6
        draw.ellipse([x - r, y - r, x + r, y + r], outline=color, width=3)
        label = LABELS[item["id"]]
        tx = x - 24
        ty = item["bbox"]["y"] - 10
        draw.text((tx + 2, ty + 2), label, fill=(20, 20, 20, 190), font=font)
        draw.text((tx, ty), label, fill=(255, 248, 226, 230), font=font)

    draw.rectangle([24, 24, 1060, 68], fill=(32, 36, 34, 210))
    draw.text(
        (38, 32),
        "T06 v2 city stamp cutout composite v3 - review labels only, no runtime/map promotion",
        fill=(255, 248, 226, 235),
        font=small,
    )


def main():
    city_base = load_city_base()
    base = Image.open(BASE).convert("RGBA")
    stamps = {key: Image.open(path).convert("RGBA") for key, path in SOURCE_FILES.items()}

    placements = []
    canvas = base.copy()
    for city_id in [
        "changan",
        "luoyang",
        "nanyang",
        "xiangyang",
        "shangyong",
        "yiling",
        "xinye",
        "hanzhong",
        "chenliu",
        "guandu",
        "xuchang",
    ]:
        city = city_base[city_id]
        concept = hex_to_pixel(city["q"], city["r"])
        p = to_output(concept)
        dx, dy = NUDGES.get(city_id, (0, 0))
        p = {"x": p["x"] + dx, "y": p["y"] + dy}
        fit_dx, fit_dy = STAMP_FIT.get(city_id, (0, 0))
        p = {"x": p["x"] + fit_dx, "y": p["y"] + fit_dy}
        cls = city_class(city_id)
        bbox = paste_stamp(canvas, stamps[source_key(cls)], p, cls, city_id)
        placements.append(
            {
                "id": city_id,
                "name": city["name"],
                "class": cls,
                "center": p,
                "bbox": bbox,
                "nudge": [dx, dy],
                "fit": [fit_dx, fit_dy],
            }
        )

    canvas.save(OUT)
    preview = canvas.copy()
    draw_review_overlay(preview, placements)
    preview.save(PREVIEW)

    manifest_json = ROOT / "terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_placements.json"
    manifest_json.write_text(json.dumps(placements, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
