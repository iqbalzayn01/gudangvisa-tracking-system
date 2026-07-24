from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
F_TITLE = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 18)
F_LANE = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 14)
F_NODE = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)
F_EDGE = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 12)

LANE_W = 640
ROW_H = 108
TOP = 110
MARGIN_BOTTOM = 70
ACT_W = 300
ACT_H_MIN = 46
DEC_W = 220
DEC_H = 100
FILL = "#dfe9f7"


def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def wrap_text(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_w(draw, trial, font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def label_box(draw, cx, cy, text, font=F_EDGE, pad=3):
    tw = text_w(draw, text, font)
    draw.rectangle([cx - tw / 2 - pad, cy - 9, cx + tw / 2 + pad, cy + 9], fill="white")
    draw.text((cx - tw / 2, cy - 8), text, font=font, fill="black")


def draw_start(draw, cx, cy, r=15):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill="black")


def draw_end(draw, cx, cy, r=17):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline="black", width=2, fill="white")
    ir = r - 6
    draw.ellipse([cx - ir, cy - ir, cx + ir, cy + ir], fill="black")


def draw_activity(draw, cx, cy, text, w=ACT_W):
    lines = wrap_text(draw, text, F_NODE, w - 24)
    line_h = 18
    h = max(ACT_H_MIN, len(lines) * line_h + 20)
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = cx + w / 2, cy + h / 2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=14, outline="black", width=2, fill=FILL)
    ty = cy - (len(lines) * line_h) / 2
    for ln in lines:
        tw = text_w(draw, ln, F_NODE)
        draw.text((cx - tw / 2, ty), ln, font=F_NODE, fill="black")
        ty += line_h
    return (x0, y0, x1, y1)


def draw_decision(draw, cx, cy, text, w=DEC_W, h=DEC_H):
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    draw.polygon(pts, outline="black", width=2, fill="white")
    lines = wrap_text(draw, text, F_NODE, w - 50)
    line_h = 16
    ty = cy - (len(lines) * line_h) / 2
    for ln in lines:
        tw = text_w(draw, ln, F_NODE)
        draw.text((cx - tw / 2, ty), ln, font=F_NODE, fill="black")
        ty += line_h
    return (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)


def draw_fork(draw, cx, cy, w=140):
    draw.line([(cx - w / 2, cy), (cx + w / 2, cy)], fill="black", width=6)
    return (cx - w / 2, cy, cx + w / 2, cy)


draw_join = draw_fork


def _arrowhead(draw, tip, direction, size=9):
    dx, dy = direction
    if dx == 0:
        sign = 1 if dy > 0 else -1
        draw.polygon([tip, (tip[0] - size / 2, tip[1] - sign * size),
                      (tip[0] + size / 2, tip[1] - sign * size)], fill="black")
    else:
        sign = 1 if dx > 0 else -1
        draw.polygon([tip, (tip[0] - sign * size, tip[1] - size / 2),
                      (tip[0] - sign * size, tip[1] + size / 2)], fill="black")


def draw_arrow(draw, p1, p2, label=None, dashed=False):
    x1, y1 = p1
    x2, y2 = p2

    def line(a, b):
        if not dashed:
            draw.line([a, b], fill="black", width=2)
            return
        (ax, ay), (bx, by) = a, b
        length = max(abs(bx - ax), abs(by - ay))
        steps = max(1, int(length / 8))
        for i in range(steps):
            t0, t1 = i / steps, min(1, (i + 0.5) / steps)
            draw.line([(ax + (bx - ax) * t0, ay + (by - ay) * t0),
                       (ax + (bx - ax) * t1, ay + (by - ay) * t1)], fill="black", width=2)

    if abs(x1 - x2) < 2:
        line((x1, y1), (x2, y2))
        _arrowhead(draw, (x2, y2), (0, y2 - y1))
        if label:
            label_box(draw, (x1 + x2) / 2, (y1 + y2) / 2, label)
        return

    if abs(y1 - y2) < 2:
        line((x1, y1), (x2, y2))
        _arrowhead(draw, (x2, y2), (x2 - x1, 0))
        if label:
            label_box(draw, (x1 + x2) / 2, (y1 + y2) / 2, label)
        return

    mid_y = (y1 + y2) / 2
    line((x1, y1), (x1, mid_y))
    line((x1, mid_y), (x2, mid_y))
    line((x2, mid_y), (x2, y2))
    _arrowhead(draw, (x2, y2), (0, y2 - mid_y))
    if label:
        label_box(draw, (x1 + x2) / 2, mid_y, label)


def render_activity(out_path, title, lanes, nodes, edges, width=None):
    """
    lanes: list of lane names (2 or 3), left-to-right
    nodes: dict id -> {type: start|activity|decision|end|fork|join, lane: int, row: float,
                        dx: int (extra px offset within lane, default 0), label: str,
                        w: optional width override}
    edges: list of (from_id, to_id, label, dashed)
    """
    lane_w = LANE_W
    n_lanes = len(lanes)
    base_width = n_lanes * lane_w + 80
    max_row = max(n["row"] for n in nodes.values())
    height = TOP + int(max_row * ROW_H) + 140 + MARGIN_BOTTOM
    lane_x0 = [40 + i * lane_w for i in range(n_lanes)]

    # pre-pass: measure node extents (font metrics don't depend on canvas size)
    dummy = Image.new("RGB", (10, 10))
    dd = ImageDraw.Draw(dummy)
    max_right = base_width
    for nid, spec in nodes.items():
        cx = lane_x0[spec["lane"]] + lane_w / 2 + spec.get("dx", 0)
        cy = TOP + spec["row"] * ROW_H
        t = spec["type"]
        if t == "activity":
            b = draw_activity(dd, cx, cy, spec["label"], w=spec.get("w", ACT_W))
        elif t == "decision":
            b = draw_decision(dd, cx, cy, spec["label"])
        elif t == "start":
            b = (cx - 15, cy - 15, cx + 15, cy + 15)
        elif t == "end":
            b = (cx - 17, cy - 17, cx + 17, cy + 17)
        else:
            b = (cx - 70, cy, cx + 70, cy)
        max_right = max(max_right, b[2] + 40)

    width = width or int(max_right)
    img = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(img)
    for i, name in enumerate(lanes):
        x0 = lane_x0[i]
        x1 = x0 + lane_w
        d.rectangle([x0, 40, x1, 78], outline="black", width=2, fill="#c9dcf2")
        tw = text_w(d, name, F_LANE)
        d.text((x0 + (lane_w - tw) / 2, 50), name, font=F_LANE, fill="black")
        d.line([(x0, 78), (x0, height - MARGIN_BOTTOM + 20)], fill="black", width=1)
    d.line([(lane_x0[-1] + lane_w, 78), (lane_x0[-1] + lane_w, height - MARGIN_BOTTOM + 20)],
           fill="black", width=1)

    centers = {}
    boxes = {}
    for nid, spec in nodes.items():
        cx = lane_x0[spec["lane"]] + lane_w / 2 + spec.get("dx", 0)
        cy = TOP + spec["row"] * ROW_H
        centers[nid] = (cx, cy)
        t = spec["type"]
        if t == "start":
            draw_start(d, cx, cy)
            boxes[nid] = (cx - 15, cy - 15, cx + 15, cy + 15)
        elif t == "end":
            draw_end(d, cx, cy)
            boxes[nid] = (cx - 17, cy - 17, cx + 17, cy + 17)
        elif t == "activity":
            boxes[nid] = draw_activity(d, cx, cy, spec["label"], w=spec.get("w", ACT_W))
        elif t == "decision":
            boxes[nid] = draw_decision(d, cx, cy, spec["label"])
        elif t in ("fork", "join"):
            boxes[nid] = draw_fork(d, cx, cy, w=spec.get("w", 140))

    def anchor(nid, towards):
        x0, y0, x1, y1 = boxes[nid]
        cx, cy = centers[nid]
        tx, ty = centers[towards]
        if abs(tx - cx) < 4:
            return (cx, y1 if ty > cy else y0)
        if abs(ty - cy) < 4:
            return (x1 if tx > cx else x0, cy)
        return (cx, y1 if ty > cy else y0)

    for edge in edges:
        fid, tid, label, dashed = (list(edge) + [None, False])[:4]
        p1 = anchor(fid, tid)
        p2 = anchor(tid, fid)
        draw_arrow(d, p1, p2, label=label, dashed=dashed)

    tw = text_w(d, title, F_TITLE)
    d.text(((width - tw) / 2, height - 34), title, font=F_TITLE, fill="black")

    img.save(out_path)
    return out_path
