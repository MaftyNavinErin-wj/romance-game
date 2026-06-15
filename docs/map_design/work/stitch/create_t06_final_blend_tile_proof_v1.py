import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
BASE = ROOT / "terrain_t06_cc_w_no_city_v2_normalized.png"
V3_COMPOSITE = ROOT / "terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3.png"
V3_PLACEMENTS = ROOT / "terrain_t06_cc_w_no_city_v2_city_stamp_composite_v3_placements.json"
OUT = ROOT / "terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1.png"
PREVIEW = ROOT / "terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1_preview.png"
REPORT = ROOT / "terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1_report.json"


CITY_CLASS_SHADOW = {
    "global-primary": {"alpha": 38, "expand_x": 1.0, "expand_y": 0.46, "blur": 18},
    "t06-standard": {"alpha": 32, "expand_x": 0.9, "expand_y": 0.42, "blur": 15},
    "subdued": {"alpha": 22, "expand_x": 0.82, "expand_y": 0.36, "blur": 12},
    "east-context": {"alpha": 20, "expand_x": 0.78, "expand_y": 0.34, "blur": 11},
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
    "guandu": "官渡",
    "xuchang": "许昌",
}


def load_inputs():
    base = Image.open(BASE).convert("RGBA")
    composite = Image.open(V3_COMPOSITE).convert("RGBA")
    placements = json.loads(V3_PLACEMENTS.read_text(encoding="utf-8"))
    if base.size != composite.size:
        raise RuntimeError(f"base/composite size mismatch: {base.size} vs {composite.size}")
    return base, composite, placements


def difference_mask(base, composite):
    diff = ImageChops.difference(base.convert("RGB"), composite.convert("RGB")).convert("L")
    # Keep only meaningful city/pad changes, then soften the edge for blend.
    mask = diff.point(lambda v: 255 if v > 10 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(5))
    return mask


def local_mask_for_item(full_mask, item, pad=44):
    bbox = item["bbox"]
    x0 = max(0, int(bbox["x"] - pad))
    y0 = max(0, int(bbox["y"] - pad))
    x1 = min(full_mask.width, int(bbox["x"] + bbox["w"] + pad))
    y1 = min(full_mask.height, int(bbox["y"] + bbox["h"] + pad))
    region = full_mask.crop((x0, y0, x1, y1))
    edge = region.filter(ImageFilter.GaussianBlur(radius=10))
    core = region.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius=2))
    return (x0, y0, x1, y1), region, edge, core


def harmonize_city_region(result, base, item, full_mask):
    box, region, edge, core = local_mask_for_item(full_mask, item)
    x0, y0, x1, y1 = box
    current = result.crop(box).convert("RGBA")
    terrain = base.crop(box).convert("RGBA")

    # Slightly reduce the source-cutout contrast and color separation, but keep
    # the v3 city layer readable.
    softened = ImageEnhance.Color(current).enhance(0.88)
    softened = ImageEnhance.Contrast(softened).enhance(0.94)
    warm = Image.new("RGBA", current.size, (219, 202, 158, 34))
    softened = Image.alpha_composite(softened, warm)

    # Edge only: blend a small amount back toward the terrain so the paper pad
    # does not read as a pasted object boundary.
    edge_only = ImageChops.subtract(edge, core.filter(ImageFilter.GaussianBlur(radius=5)))
    edge_only = edge_only.filter(ImageFilter.GaussianBlur(radius=7))
    edge_soft = Image.blend(current, terrain, 0.22)
    current = Image.composite(edge_soft, current, edge_only)

    # City/pad interior: apply tone harmonization without moving or resizing.
    tone_mask = core.point(lambda v: int(v * 0.58))
    current = Image.composite(softened, current, tone_mask)
    result.paste(current, (x0, y0), current)


def add_contact_shadow(layer, item):
    cfg = CITY_CLASS_SHADOW[item["class"]]
    bbox = item["bbox"]
    cx = bbox["x"] + bbox["w"] / 2
    cy = bbox["y"] + bbox["h"] * 0.68
    rx = bbox["w"] * cfg["expand_x"]
    ry = bbox["h"] * cfg["expand_y"]
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse(
        [cx - rx, cy - ry * 0.44, cx + rx, cy + ry],
        fill=(58, 52, 35, cfg["alpha"]),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=cfg["blur"]))
    layer.alpha_composite(shadow)


def add_whole_tile_wash(img):
    # A low-opacity paper unification pass. It is intentionally subtle so that
    # terrain geography remains reviewable.
    wash = Image.new("RGBA", img.size, (224, 207, 164, 18))
    out = Image.alpha_composite(img, wash)
    out = ImageEnhance.Color(out).enhance(0.96)
    out = ImageEnhance.Contrast(out).enhance(0.985)
    return out


def draw_preview(img, placements):
    preview = img.copy()
    draw = ImageDraw.Draw(preview)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 28)
        small = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 22)
    except OSError:
        font = ImageFont.load_default()
        small = ImageFont.load_default()

    draw.rectangle([24, 24, 1120, 68], fill=(32, 36, 34, 210))
    draw.text(
        (38, 32),
        "T06 final blend tile proof v1 - v3 placement/scale locked, review labels only",
        fill=(255, 248, 226, 235),
        font=small,
    )

    for item in placements:
        bbox = item["bbox"]
        x = item["center"]["x"]
        y = item["center"]["y"]
        color = {
            "global-primary": (255, 190, 72, 210),
            "t06-standard": (97, 219, 232, 210),
            "subdued": (196, 142, 255, 190),
            "east-context": (255, 139, 104, 190),
        }[item["class"]]
        draw.rectangle(
            [bbox["x"], bbox["y"], bbox["x"] + bbox["w"], bbox["y"] + bbox["h"]],
            outline=color,
            width=2,
        )
        draw.ellipse([x - 5, y - 5, x + 5, y + 5], outline=color, width=3)
        label = LABELS.get(item["id"], item["name"])
        tx = bbox["x"]
        ty = bbox["y"] - 30
        draw.text((tx + 2, ty + 2), label, fill=(20, 20, 20, 190), font=font)
        draw.text((tx, ty), label, fill=(255, 248, 226, 230), font=font)

    return preview


def main():
    base, composite, placements = load_inputs()
    full_mask = difference_mask(base, composite)

    result = composite.copy()

    shadow_layer = Image.new("RGBA", result.size, (0, 0, 0, 0))
    for item in placements:
        add_contact_shadow(shadow_layer, item)
    result = Image.alpha_composite(result, shadow_layer)

    for item in placements:
        harmonize_city_region(result, base, item, full_mask)

    result = add_whole_tile_wash(result)
    result.save(OUT)

    preview = draw_preview(result, placements)
    preview.save(PREVIEW)

    report = {
        "candidate_id": "terrain_t06_cc_w_no_city_v2_final_blend_tile_proof_v1",
        "base": str(BASE.relative_to(ROOT.parents[3])),
        "locked_reference": str(V3_COMPOSITE.relative_to(ROOT.parents[3])),
        "locked_placements": str(V3_PLACEMENTS.relative_to(ROOT.parents[3])),
        "output": str(OUT.relative_to(ROOT.parents[3])),
        "preview": str(PREVIEW.relative_to(ROOT.parents[3])),
        "output_size": list(result.size),
        "placement_count": len(placements),
        "placement_ids": [p["id"] for p in placements],
        "locked_invariants": {
            "city_count_unchanged": len(placements) == 11,
            "placement_json_unmodified": True,
            "scale_unmodified": True,
            "runtime_files_touched": False,
        },
        "operations": [
            "diff-mask city/pad detection from v3 composite versus no-city terrain",
            "local contact shadows under existing v3 stamp bboxes",
            "localized edge blend toward terrain around detected city-layer mask",
            "localized paper-tone harmonization inside detected city-layer mask",
            "subtle whole-tile paper wash",
        ],
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
