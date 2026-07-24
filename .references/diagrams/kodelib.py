from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
F_CELL = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 22)
F_LABEL = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)
F_CAPTION = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 15)
F_KET_HEAD = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 13)
F_KET = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)

CELL_W = 74
CELL_H = 64
SEG_GAP = 56
MARGIN = 60
BRACKET_DROP = 22
STEM_LEN = 34
LABEL_H = 34


def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def _arrow_up(d, tip, size=7):
    x, y = tip
    d.polygon([(x, y), (x - size / 2, y + size), (x + size / 2, y + size)], fill="black")


def _seg_widths(segments):
    return [len(chars) * CELL_W for _, chars in segments]


def _total_width(segments):
    widths = _seg_widths(segments)
    return sum(widths) + SEG_GAP * (len(segments) - 1)


def _draw_segment_row(d, x0, y, segments):
    """Draws one row of grouped cells; returns (list of (label, cell_xs, group_left, group_right), bottom_y, next_x)."""
    groups = []
    x = x0
    for label, chars in segments:
        xs = []
        for ch in chars:
            d.rectangle([x, y, x + CELL_W, y + CELL_H], outline="black", width=2, fill="white")
            tw = text_w(d, ch, F_CELL)
            d.text((x + CELL_W / 2 - tw / 2, y + CELL_H / 2 - 14), ch, font=F_CELL, fill="black")
            xs.append(x + CELL_W / 2)
            x += CELL_W
        groups.append((label, xs, xs[0], xs[-1]))
        x += SEG_GAP
    return groups, y + CELL_H, x - SEG_GAP


def _draw_group_labels(d, groups, cell_bottom_y):
    """Draws bracket + arrows + label box under each group. Returns bottom y of label boxes."""
    bracket_y = cell_bottom_y + BRACKET_DROP
    label_y = bracket_y + STEM_LEN
    max_bottom = label_y + LABEL_H
    for label, xs, left, right in groups:
        for cx in xs:
            d.line([(cx, bracket_y), (cx, cell_bottom_y)], fill="black", width=2)
            _arrow_up(d, (cx, cell_bottom_y))
        d.line([(left, bracket_y), (right, bracket_y)], fill="black", width=2)
        mid_x = (left + right) / 2
        d.line([(mid_x, bracket_y), (mid_x, label_y)], fill="black", width=2)
        tw = text_w(d, label, F_LABEL)
        bw = max(tw + 24, right - left + 10)
        bx0 = mid_x - bw / 2
        d.rectangle([bx0, label_y, bx0 + bw, label_y + LABEL_H], outline="black", width=2, fill="white")
        d.text((mid_x - tw / 2, label_y + (LABEL_H - 14) / 2), label, font=F_LABEL, fill="black")
        max_bottom = max(max_bottom, label_y + LABEL_H)
    return max_bottom


def render_kode(out_path, gambar_no, title, top_segments, bottom_segments, keterangan):
    grid_w = max(_total_width(top_segments), _total_width(bottom_segments))
    ket_w = 0

    dummy = Image.new("RGB", (10, 10))
    dd = ImageDraw.Draw(dummy)
    for code, desc in keterangan:
        line = f"{code} : {desc}"
        ket_w = max(ket_w, text_w(dd, line, F_KET))
    cap1 = f"Gambar {gambar_no}"
    ket_w = max(ket_w, text_w(dd, cap1, F_CAPTION), text_w(dd, title, F_CAPTION))

    width = int(max(grid_w, ket_w)) + MARGIN * 2

    y = MARGIN
    x0 = MARGIN + (width - MARGIN * 2 - grid_w) / 2

    top_x0 = x0 + (grid_w - _total_width(top_segments)) / 2
    bot_x0 = x0 + (grid_w - _total_width(bottom_segments)) / 2

    # pass 1 on dummy image to compute heights precisely (same layout math, no need since deterministic)
    groups1, bottom1, _ = _draw_segment_row(dd, top_x0, y, top_segments)
    lbl_bottom1 = _draw_group_labels(dd, groups1, bottom1)
    y2 = lbl_bottom1 + 70
    groups2, bottom2, _ = _draw_segment_row(dd, bot_x0, y2, bottom_segments)
    lbl_bottom2 = _draw_group_labels(dd, groups2, bottom2)

    caption_y = lbl_bottom2 + 40
    title_y = caption_y + 22
    ket_head_y = title_y + 40
    ket_y = ket_head_y + 26
    height = int(ket_y + len(keterangan) * 22 + MARGIN)

    img = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(img)

    groups1, bottom1, _ = _draw_segment_row(d, top_x0, y, top_segments)
    lbl_bottom1 = _draw_group_labels(d, groups1, bottom1)
    groups2, bottom2, _ = _draw_segment_row(d, bot_x0, y2, bottom_segments)
    lbl_bottom2 = _draw_group_labels(d, groups2, bottom2)

    tw = text_w(d, cap1, F_CAPTION)
    d.text((width / 2 - tw / 2, caption_y), cap1, font=F_CAPTION, fill="black")
    tw = text_w(d, title, F_CAPTION)
    d.text((width / 2 - tw / 2, title_y), title, font=F_CAPTION, fill="black")

    d.text((MARGIN, ket_head_y), "Keterangan :", font=F_KET_HEAD, fill="black")
    ky = ket_y
    for code, desc in keterangan:
        d.text((MARGIN, ky), code, font=F_KET, fill="black")
        d.text((MARGIN + 90, ky), f": {desc}", font=F_KET, fill="black")
        ky += 22

    img.save(out_path)
    return out_path
