from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
f_title = ImageFont.truetype(FONT_DIR + "DejaVuSans-Bold.ttf", 17)
f_body = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)
f_rel = ImageFont.truetype(FONT_DIR + "DejaVuSans.ttf", 13)

W, H = 1950, 1420
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)

def text_w(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]

def draw_class(draw, x, y, name, attrs, methods, w=340):
    pad = 8
    line_h = 19
    title_h = 32
    attrs_h = pad * 2 + line_h * max(len(attrs), 1)
    methods_h = pad * 2 + line_h * max(len(methods), 1)
    total_h = title_h + attrs_h + methods_h

    draw.rectangle([x, y, x + w, y + total_h], outline="black", width=2, fill="#eef4fb")
    draw.rectangle([x, y, x + w, y + title_h], outline="black", width=2, fill="#c9dcf2")
    tw = text_w(draw, name, f_title)
    draw.text((x + (w - tw) / 2, y + 6), name, font=f_title, fill="black")

    y2 = y + title_h
    draw.line([x, y2, x + w, y2], fill="black", width=2)
    ay = y2 + pad
    for a in attrs:
        draw.text((x + pad, ay), "- " + a, font=f_body, fill="black")
        ay += line_h

    y3 = y2 + attrs_h
    draw.line([x, y3, x + w, y3], fill="black", width=2)
    my = y3 + pad
    for m in methods:
        draw.text((x + pad, my), "+ " + m, font=f_body, fill="black")
        my += line_h

    return (x, y, x + w, y + total_h)

def label_box(draw, cx, cy, text, font=f_rel, pad=3):
    tw = text_w(draw, text, font)
    draw.rectangle([cx - tw / 2 - pad, cy - 9, cx + tw / 2 + pad, cy + 9], fill="white")
    draw.text((cx - tw / 2, cy - 8), text, font=font, fill="black")

def channel(draw, fx, fy, tx, ty, mid_y, label, m_from, m_to):
    draw.line([(fx, fy), (fx, mid_y)], fill="black", width=2)
    draw.line([(fx, mid_y), (tx, mid_y)], fill="black", width=2)
    draw.line([(tx, mid_y), (tx, ty)], fill="black", width=2)
    draw.text((fx + 5, fy + 3), m_from, font=f_rel, fill="black")
    draw.text((tx + 5, ty - 18), m_to, font=f_rel, fill="black")
    lx = (fx + tx) / 2 if fx != tx else fx
    label_box(draw, lx, mid_y - 12, label)

# Title
title = "Gambar IV.17 Class Diagram – Sistem Informasi Pemantauan Dokumen Pengurusan Visa"
tw = text_w(d, title, f_title)
d.text(((W - tw) / 2, 20), title, font=f_title, fill="black")

client_box = draw_class(d, 60, 90,
    "ClientAccount",
    ["id: uuid", "email: string", "passwordHash: string", "fullName: string",
     "passportNumber: string", "nationality: string", "phone: string", "isActive: boolean"],
    ["createClientAccount()", "getAllClients()", "getClientById()", "updateClient()", "removeClient()"])

staff_box = draw_class(d, 1550, 90,
    "StaffAccount",
    ["id: uuid", "email: string", "passwordHash: string", "fullName: string",
     "role: admin | staff", "phone: string", "isActive: boolean"],
    ["createNewStaff()", "getAllStaff()", "removeStaff()"])

app_box = draw_class(d, 760, 470,
    "Application",
    ["id: uuid", "referenceNumber: string (GV-YYYY-NNNNN)", "clientId: uuid (FK)",
     "assignedStaffId: uuid (FK)", "visaType: enum", "status: enum (16 values)",
     "priority: enum", "progressPercentage: int", "checklist: jsonb[]",
     "biometricStatus/Date/Time/Location"],
    ["createApplication()", "getAllApplications()", "getApplicationById()",
     "updateApplicationStatus()", "updateBiometricSchedule()",
     "toggleChecklistItem()", "getApplicationsByClientId()", "deleteApplication()"],
    w=420)

doc_box = draw_class(d, 60, 950,
    "ApplicationDocument",
    ["id: uuid", "applicationId: uuid (FK)", "documentType: enum",
     "fileName: string", "filePath: string", "status: pending|verified|rejected",
     "issuedDate/expiryDate: date", "verifiedByStaffId: uuid (FK)"],
    ["generateUploadUrl()", "addDocument()", "getExpiringDocuments()",
     "getDocumentsByApplication()", "verifyDocument()",
     "getClientDownloadUrl()", "removeDocument()"])

track_box = draw_class(d, 560, 950,
    "TrackingHistory",
    ["id: uuid", "applicationId: uuid (FK)", "fromStatus/toStatus: enum",
     "description: string", "changedByStaffId: uuid (FK)",
     "isVisibleToClient: boolean", "createdAt: timestamp"],
    [],
    w=320)

notif_box = draw_class(d, 1020, 950,
    "Notification",
    ["id: uuid", "clientId: uuid (FK)", "applicationId: uuid (FK)",
     "title: string", "message: string", "isRead: boolean", "createdAt: timestamp"],
    ["getByClientId()", "markAsRead()"],
    w=320)

audit_box = draw_class(d, 1500, 950,
    "AuditLog",
    ["id: uuid", "staffId: uuid (FK)", "applicationId: uuid (FK, optional)",
     "action: enum", "entityType: string", "oldValues/newValues: jsonb",
     "ipAddress: string", "createdAt: timestamp"],
    ["getAllLogs()", "getLogById()"],
    w=360)

def bottom_x(box, off):
    return box[0] + off

def top_x(box, off):
    return box[0] + off

# redo the six relationships with clean fixed offsets
channel(d, bottom_x(client_box, 260), client_box[3], top_x(app_box, 90), app_box[1], 415, "mengajukan", "1", "*")
channel(d, bottom_x(staff_box, 100), staff_box[3], top_x(app_box, 330), app_box[1], 415, "menangani", "1", "*")
channel(d, bottom_x(app_box, 60), app_box[3], top_x(doc_box, 170), doc_box[1], 884, "memiliki", "1", "*")
channel(d, bottom_x(app_box, 210), app_box[3], top_x(track_box, 160), track_box[1], 900, "mencatat", "1", "*")
channel(d, bottom_x(app_box, 360), app_box[3], top_x(notif_box, 160), notif_box[1], 916, "memicu", "1", "*")
channel(d, bottom_x(staff_box, 250), staff_box[3], top_x(audit_box, 180), audit_box[1], 700, "melakukan", "1", "*")

out_path = "/tmp/claude-1000/-home-miqbalzayyn-projects-gudang-visa/9de53541-bc54-4eb2-a3bc-536da4f33507/scratchpad/diagrams/class_diagram.png"
img.save(out_path)
print("saved", out_path, "size", img.size)
