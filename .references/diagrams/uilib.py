from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
F_TITLE = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 20)
F_H = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 16)
F_LABEL = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 12)
F_TEXT = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 12)
F_SMALL = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 10)
F_LOGO = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 14)
F_CAPTION = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 15)

WHITE = "white"
CHROME = "#e5e7eb"
BORDER = "#9ca3af"
LINE = "#d1d5db"
PANEL = "#f3f4f6"
PRIMARY = "#2563eb"
PRIMARY_DARK = "#1d4ed8"
SIDEBAR_BG = "#1f2937"
SIDEBAR_ACTIVE = "#2563eb"
SIDEBAR_TEXT = "#9ca3af"
SIDEBAR_TEXT_ACTIVE = "white"
TEXT = "#111827"
MUTED = "#6b7280"
GREEN = "#16a34a"
RED = "#dc2626"
AMBER = "#d97706"
CARD_BORDER = "#e5e7eb"

W = 1280
CHROME_H = 44


def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def new_canvas(height):
    img = Image.new("RGB", (W, height), WHITE)
    return img, ImageDraw.Draw(img)


def draw_chrome(d, url_text):
    d.rectangle([0, 0, W, CHROME_H], fill=CHROME)
    for i, cx in enumerate([20, 40, 60]):
        d.ellipse([cx, 16, cx + 12, 28], fill=["#ef4444", "#f59e0b", "#22c55e"][i])
    bar_x0, bar_x1 = 110, W - 20
    d.rounded_rectangle([bar_x0, 10, bar_x1, 34], radius=12, fill="white", outline=BORDER, width=1)
    d.text((bar_x0 + 14, 15), url_text, font=F_TEXT, fill=MUTED)
    d.line([(0, CHROME_H), (W, CHROME_H)], fill=BORDER, width=1)


def rect(d, x0, y0, x1, y1, fill=None, outline=BORDER, width=1, radius=0):
    if radius:
        d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)
    else:
        d.rectangle([x0, y0, x1, y1], fill=fill, outline=outline, width=width)


def line_bar(d, x, y, w, h=9, color=LINE):
    rect(d, x, y, x + w, y + h, fill=color, outline=None, radius=h / 2)


def draw_button(d, x, y, w, h, text, filled=True, color=PRIMARY):
    if filled:
        rect(d, x, y, x + w, y + h, fill=color, outline=None, radius=6)
        text_color = "white"
    else:
        rect(d, x, y, x + w, y + h, fill="white", outline=color, width=2, radius=6)
        text_color = color
    tw = text_w(d, text, F_LABEL)
    d.text((x + (w - tw) / 2, y + (h - 14) / 2), text, font=F_LABEL, fill=text_color)


def draw_input(d, x, y, w, h, label, value_placeholder=""):
    d.text((x, y), label, font=F_LABEL, fill=TEXT)
    fy = y + 18
    rect(d, x, fy, x + w, fy + h, fill="white", outline=BORDER, width=1, radius=5)
    if value_placeholder:
        d.text((x + 10, fy + (h - 12) / 2), value_placeholder, font=F_TEXT, fill=MUTED)
    return fy + h


def draw_card(d, x, y, w, h, title=None):
    rect(d, x, y, x + w, y + h, fill="white", outline=CARD_BORDER, width=1, radius=8)
    ty = y + 14
    if title:
        d.text((x + 16, ty), title, font=F_H, fill=TEXT)
        ty += 26
    return ty


def draw_stat_card(d, x, y, w, h, label, value, color=PRIMARY):
    rect(d, x, y, x + w, y + h, fill="white", outline=CARD_BORDER, width=1, radius=8)
    d.text((x + 16, y + 14), label, font=F_TEXT, fill=MUTED)
    d.text((x + 16, y + 34), value, font=F_TITLE, fill=color)


def draw_badge(d, x, y, text, color):
    tw = text_w(d, text, F_SMALL)
    w = tw + 16
    rect(d, x, y, x + w, y + 20, fill=color, outline=None, radius=10)
    d.text((x + 8, y + 4), text, font=F_SMALL, fill="white")
    return w


def draw_table(d, x, y, w, headers, rows, col_ratios=None, row_h=34):
    n = len(headers)
    col_ratios = col_ratios or [1] * n
    total = sum(col_ratios)
    col_w = [w * r / total for r in col_ratios]
    xs = [x]
    for cw in col_w:
        xs.append(xs[-1] + cw)

    head_h = 32
    rect(d, x, y, x + w, y + head_h, fill=PANEL, outline=BORDER, width=1)
    for i, h in enumerate(headers):
        d.text((xs[i] + 10, y + 9), h, font=F_LABEL, fill=TEXT)

    ry = y + head_h
    for row in rows:
        rect(d, x, ry, x + w, ry + row_h, fill="white", outline=CARD_BORDER, width=1)
        for i, cell in enumerate(row):
            if isinstance(cell, tuple):
                kind, val = cell
                if kind == "badge":
                    text, color = val
                    draw_badge(d, xs[i] + 10, ry + 7, text, color)
                    continue
            d.text((xs[i] + 10, ry + (row_h - 12) / 2), str(cell), font=F_TEXT, fill=TEXT)
        ry += row_h
    d.rectangle([x, y, x + w, ry], outline=BORDER, width=1)
    return ry


def draw_sidebar(d, x, y, w, h, items, active_idx, brand="Gudang Visa Bali"):
    rect(d, x, y, x + w, y + h, fill=SIDEBAR_BG, outline=None)
    d.text((x + 20, y + 22), brand, font=F_LOGO, fill="white")
    iy = y + 70
    for i, label in enumerate(items):
        active = i == active_idx
        if active:
            rect(d, x + 10, iy, x + w - 10, iy + 36, fill=SIDEBAR_ACTIVE, outline=None, radius=6)
        d.ellipse([x + 22, iy + 11, x + 34, iy + 23], outline=(SIDEBAR_TEXT_ACTIVE if active else SIDEBAR_TEXT), width=2)
        d.text((x + 46, iy + 9), label, font=F_TEXT, fill=(SIDEBAR_TEXT_ACTIVE if active else SIDEBAR_TEXT))
        iy += 44
    return iy


def draw_topbar(d, x, y, w, h, title, user_label="Admin"):
    rect(d, x, y, x + w, y + h, fill="white", outline=None)
    d.line([(x, y + h), (x + w, y + h)], fill=CARD_BORDER, width=1)
    d.text((x + 24, y + (h - 20) / 2), title, font=F_TITLE, fill=TEXT)
    chip_w = 130
    cx = x + w - chip_w - 24
    d.ellipse([cx, y + h / 2 - 14, cx + 28, y + h / 2 + 14], fill=PANEL, outline=BORDER)
    d.text((cx + 36, y + h / 2 - 7), user_label, font=F_TEXT, fill=TEXT)
    return y + h


def draw_caption(d, y, gambar_no, title, width=W):
    tw = text_w(d, f"Gambar {gambar_no}", F_CAPTION)
    d.text(((width - tw) / 2, y), f"Gambar {gambar_no}", font=F_CAPTION, fill="black")
    tw = text_w(d, title, F_CAPTION)
    d.text(((width - tw) / 2, y + 20), title, font=F_CAPTION, fill="black")
    return y + 44


def finish(img, out_path):
    img.save(out_path)
    return out_path
