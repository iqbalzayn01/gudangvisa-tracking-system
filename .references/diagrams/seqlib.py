from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
F_TITLE = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 18)
F_ACTOR = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 14)
F_MSG = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)
F_NOTE = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 12)

LANE_W = 300
TOP = 130
ROW_H = 46
MARGIN_BOTTOM = 90


def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_actor_stub(draw, cx, y):
    r = 12
    draw.ellipse([cx - r, y, cx + r, y + r * 2], outline="black", width=2)
    draw.line([(cx, y + r * 2), (cx, y + r * 2 + 28)], fill="black", width=2)
    draw.line([(cx - 15, y + r * 2 + 9), (cx + 15, y + r * 2 + 9)], fill="black", width=2)
    draw.line([(cx, y + r * 2 + 28), (cx - 13, y + r * 2 + 50)], fill="black", width=2)
    draw.line([(cx, y + r * 2 + 28), (cx + 13, y + r * 2 + 50)], fill="black", width=2)


def label_box(draw, cx, cy, text, font=F_MSG, pad=3):
    tw = text_w(draw, text, font)
    draw.rectangle([cx - tw / 2 - pad, cy - 9, cx + tw / 2 + pad, cy + 9], fill="white")
    draw.text((cx - tw / 2, cy - 8), text, font=font, fill="black")


def render_sequence(out_path, title, participants, messages, notes=None, lane_w=LANE_W):
    n = len(participants)
    width = 80 + n * lane_w + 260
    bottom = TOP + 40 + len(messages) * ROW_H
    note_lines = notes or []
    height = bottom + MARGIN_BOTTOM + len(note_lines) * 18 + 50

    img = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(img)

    xs = []
    for i, (label, kind) in enumerate(participants):
        cx = 80 + lane_w * i + lane_w / 2
        xs.append(cx)
        lines = label.split("\n")
        if kind == "actor":
            draw_actor_stub(d, cx, 15)
            ty = 15 + 24 + 50 + 4
            for j, ln in enumerate(lines):
                tw = text_w(d, ln, F_ACTOR)
                d.text((cx - tw / 2, ty + j * 18), ln, font=F_ACTOR, fill="black")
        else:
            box_w = max(text_w(d, ln, F_ACTOR) for ln in lines) + 22
            box_h = 22 * len(lines) + 14
            x0 = cx - box_w / 2
            d.rectangle([x0, 15, x0 + box_w, 15 + box_h], outline="black", width=2, fill="#dfe9f7")
            for j, ln in enumerate(lines):
                tw = text_w(d, ln, F_ACTOR)
                d.text((cx - tw / 2, 15 + 7 + j * 22), ln, font=F_ACTOR, fill="black")
        d.line([(cx, TOP), (cx, bottom)], fill="gray", width=1)

    y = TOP + 30
    for msg in messages:
        label = msg["label"]
        fi = msg["from"]
        ti = msg["to"]
        dashed = msg.get("dashed", False)
        note = msg.get("note")
        if note:
            d.text((xs[fi] + 8, y - 16), note, font=F_NOTE, fill="#555555")
            y += 18

        if fi == ti:
            fx = xs[fi]
            d.line([(fx, y), (fx + 70, y)], fill="black", width=1)
            d.line([(fx + 70, y), (fx + 70, y + 20)], fill="black", width=1)
            d.line([(fx + 70, y + 20), (fx, y + 20)], fill="black", width=1)
            d.polygon([(fx, y + 20), (fx + 9, y + 15), (fx + 9, y + 25)], fill="black")
            tw = text_w(d, label, F_MSG)
            d.text((fx + 8, y - 16), label, font=F_MSG, fill="black")
            y += ROW_H
            continue

        fx, tx = xs[fi], xs[ti]
        direction = 1 if tx > fx else -1
        if dashed:
            lo, hi = min(fx, tx), max(fx, tx)
            xseg = lo
            while xseg < hi:
                seg_end = min(xseg + 6, hi)
                d.line([(xseg, y), (seg_end, y)], fill="black", width=1)
                xseg += 10
        else:
            d.line([(fx, y), (tx, y)], fill="black", width=1)
        ah = 8
        if direction > 0:
            d.polygon([(tx, y), (tx - ah, y - 5), (tx - ah, y + 5)], fill="black")
        else:
            d.polygon([(tx, y), (tx + ah, y - 5), (tx + ah, y + 5)], fill="black")
        mid = (fx + tx) / 2
        label_box(d, mid, y - 13, label)
        y += ROW_H

    ny = bottom + 30
    for line in note_lines:
        d.text((80, ny), line, font=F_NOTE, fill="#555555")
        ny += 18

    tw = text_w(d, title, F_TITLE)
    d.text(((width - tw) / 2, height - 34), title, font=F_TITLE, fill="black")

    img.save(out_path)
    return out_path
