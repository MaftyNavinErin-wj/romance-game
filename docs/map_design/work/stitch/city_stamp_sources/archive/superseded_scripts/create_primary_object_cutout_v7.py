from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


BASE = Path(__file__).resolve().parent
SRC = BASE / "t06_city_stamp_source_v1_primary_large.png"
OUT = BASE / "t06_city_stamp_source_v1_primary_large_cutout_object_v7.png"
PREVIEW = BASE / "t06_city_stamp_source_v1_primary_large_cutout_object_v7_preview.png"
OUT_V8 = BASE / "t06_city_stamp_source_v1_primary_large_cutout_object_v8.png"
PREVIEW_V8 = BASE / "t06_city_stamp_source_v1_primary_large_cutout_object_v8_preview.png"


SCALE = 4


def scaled(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def make_checkerboard(size, cell=32):
    w, h = size
    bg = Image.new("RGB", size, (242, 235, 210))
    draw = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if ((x // cell) + (y // cell)) % 2 == 0:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(218, 211, 190))
    return bg


def crop_to_alpha(img, margin=10):
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


def main():
    src = Image.open(SRC).convert("RGBA")
    w, h = src.size
    hi_size = (w * SCALE, h * SCALE)

    main_mask = Image.new("L", hi_size, 0)
    draw = ImageDraw.Draw(main_mask)

    # Main city footprint. This follows the outside wall/tower silhouette and
    # intentionally excludes the road-like bridge/ramp extensions outside gates.
    footprint = [
        (70, 370),
        (130, 300),
        (275, 225),
        (480, 105),
        (610, 72),
        (815, 92),
        (1012, 160),
        (1245, 282),
        (1350, 360),
        (1372, 425),
        (1308, 472),
        (1162, 525),
        (1020, 592),
        (795, 668),
        (665, 758),
        (526, 714),
        (310, 650),
        (165, 552),
        (82, 460),
    ]
    draw.polygon(scaled(footprint), fill=255)

    # Specific protrusions for tower/gate masses that sit outside the simple wall
    # polygon but are still part of the city object, not road graph material.
    protrusions = [
        [(72, 325), (120, 270), (170, 286), (158, 360), (105, 382)],
        [(430, 86), (515, 52), (575, 88), (545, 138), (462, 132)],
        [(760, 78), (835, 56), (895, 96), (870, 150), (790, 136)],
        [(1000, 143), (1088, 160), (1102, 236), (1015, 230)],
        [(1265, 295), (1358, 322), (1376, 410), (1290, 414)],
        [(610, 705), (706, 714), (698, 790), (620, 776)],
        [(1000, 560), (1090, 592), (1080, 682), (995, 650)],
    ]
    for poly in protrusions:
        draw.polygon(scaled(poly), fill=255)

    # A small structural close keeps interior courtyards, roofs, and wall gaps from
    # punching accidental holes in the object alpha.
    main_mask = main_mask.filter(ImageFilter.MaxFilter(13))
    main_mask = main_mask.filter(ImageFilter.MinFilter(7))
    main_mask = main_mask.filter(ImageFilter.GaussianBlur(2.0 * SCALE))

    # Very narrow shadow support around the footprint so the city does not float
    # when composited, without keeping the original oval paper wash.
    shadow_mask = Image.new("L", hi_size, 0)
    shadow_draw = ImageDraw.Draw(shadow_mask)
    shadow_footprint = [
        (58, 382),
        (116, 300),
        (275, 220),
        (480, 100),
        (615, 66),
        (822, 86),
        (1024, 154),
        (1258, 276),
        (1370, 362),
        (1392, 442),
        (1318, 498),
        (1165, 548),
        (1035, 614),
        (802, 694),
        (672, 790),
        (510, 738),
        (296, 672),
        (145, 568),
        (64, 468),
    ]
    shadow_draw.polygon(scaled(shadow_footprint), fill=85)
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(10.0 * SCALE))

    alpha_hi = Image.composite(main_mask, shadow_mask, main_mask)
    alpha = alpha_hi.resize((w, h), Image.Resampling.LANCZOS)

    rgba = src.copy()
    rgba.putalpha(alpha)
    cutout, bbox = crop_to_alpha(rgba, margin=6)
    cutout.save(OUT)

    preview = make_checkerboard((1200, 760))
    draw_preview = ImageDraw.Draw(preview)
    draw_preview.text((30, 24), "primary large object cutout v7", fill=(35, 31, 24))
    max_w, max_h = 1080, 620
    scale = min(max_w / cutout.width, max_h / cutout.height)
    shown = cutout.resize((int(cutout.width * scale), int(cutout.height * scale)), Image.Resampling.LANCZOS)
    preview.paste(shown, (60, 80), shown)
    draw_preview.text(
        (30, 710),
        f"transparent PNG: {cutout.width} x {cutout.height}; source bbox={bbox}; road-like gate ramps excluded from main cutout",
        fill=(35, 31, 24),
    )
    preview.save(PREVIEW)

    # v8: object-only proof. No broad paper wash, no oval pad. This is a
    # tighter hand-guided city-body alpha intended to behave like a cut paper
    # object. Road-like gate ramps are excluded from the main object.
    object_mask = Image.new("L", hi_size, 0)
    object_draw = ImageDraw.Draw(object_mask)
    object_outline = [
        (58, 352),
        (118, 292),
        (472, 122),
        (610, 84),
        (816, 104),
        (1032, 168),
        (1276, 292),
        (1370, 356),
        (1350, 420),
        (1210, 488),
        (1118, 540),
        (1088, 672),
        (1018, 682),
        (978, 610),
        (812, 672),
        (666, 782),
        (532, 742),
        (490, 682),
        (308, 632),
        (154, 532),
        (78, 452),
    ]
    object_draw.polygon(scaled(object_outline), fill=255)

    object_protrusions = [
        [(65, 322), (120, 262), (172, 284), (164, 366), (100, 386)],
        [(428, 84), (516, 50), (580, 88), (548, 140), (458, 134)],
        [(764, 78), (835, 56), (900, 98), (874, 152), (790, 138)],
        [(998, 140), (1092, 158), (1105, 238), (1012, 232)],
        [(1268, 292), (1360, 320), (1382, 410), (1292, 418)],
        [(604, 706), (708, 716), (704, 794), (620, 780)],
        [(998, 560), (1090, 592), (1084, 678), (1000, 654)],
    ]
    for poly in object_protrusions:
        object_draw.polygon(scaled(poly), fill=255)

    object_mask = object_mask.filter(ImageFilter.MaxFilter(9))
    object_mask = object_mask.filter(ImageFilter.MinFilter(5))
    object_mask = object_mask.filter(ImageFilter.GaussianBlur(1.25 * SCALE))
    object_alpha = object_mask.resize((w, h), Image.Resampling.LANCZOS)

    object_rgba = src.copy()
    object_rgba.putalpha(object_alpha)
    object_cutout, object_bbox = crop_to_alpha(object_rgba, margin=4)
    object_cutout.save(OUT_V8)

    preview_v8 = make_checkerboard((1200, 760))
    draw_preview_v8 = ImageDraw.Draw(preview_v8)
    draw_preview_v8.text((30, 24), "primary large object-only cutout v8", fill=(35, 31, 24))
    scale_v8 = min(max_w / object_cutout.width, max_h / object_cutout.height)
    shown_v8 = object_cutout.resize(
        (int(object_cutout.width * scale_v8), int(object_cutout.height * scale_v8)),
        Image.Resampling.LANCZOS,
    )
    preview_v8.paste(shown_v8, (60, 80), shown_v8)
    draw_preview_v8.text(
        (30, 710),
        f"transparent PNG: {object_cutout.width} x {object_cutout.height}; source bbox={object_bbox}; object body only, broad wash removed",
        fill=(35, 31, 24),
    )
    preview_v8.save(PREVIEW_V8)


if __name__ == "__main__":
    main()
