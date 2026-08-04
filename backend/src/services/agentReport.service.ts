// backend/src/controllers/agentReport.controller.ts
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Agent } from "../models/Agent.model";
import { Ad } from "../models/Ad.model";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

/* ============================================================
 * توابع کمکی اصلاح چیدمان متون فارسی و اعداد انگلیسی در PDFKit
 * ============================================================ */

/** اصلاح هوشمند متن:
 * - اگر رشته عددی/تاریخی باشد → بدون تغییر (همان انگلیسی) برمی‌گردد
 * - اگر متنی باشد → معکوس می‌شود (برای چیدمان راست‌چین) اما اعداد انگلیسی باقی می‌مانند
 */
const fixPersianSmart = (text: string | number | undefined | null): string => {
  if (text === null || text === undefined) return "";
  let str = String(text).trim();
  if (!str) return "";

  // اگر رشته فقط شامل اعداد، جداکننده‌ها و فاصله باشد، بدون تغییر برگردان
  if (/^[\d\-:/\s،٪%،.]+$/.test(str)) {
    return str; // اعداد انگلیسی باقی می‌مانند
  }

  // برای متون فارسی: کلمات را جدا کرده، معکوس می‌کنیم (اعداد انگلیسی حفظ می‌شوند)
  const words = str.split(/\s+/);
  const processedWords = words.map((w) => {
    // اصلاح موقعیت پرانتزها
    if (w.includes("(") || w.includes(")")) {
      return w
        .replace(/\(/g, "TEMP_OPEN")
        .replace(/\)/g, "(")
        .replace(/TEMP_OPEN/g, ")");
    }
    return w;
  });

  return processedWords.reverse().join(" ");
};

/** دریافت تاریخ شمسی استاندارد به فرمت 1405/05/01 با اعداد انگلیسی */
const getFormattedPersianDate = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    numberingSystem: "latn", // اعداد انگلیسی
  }).format(now);
};

/** دریافت زمان به فرمت 17:30 با اعداد انگلیسی */
const getFormattedPersianTime = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    numberingSystem: "latn",
  }).format(now);
};

// ======================== Excel (فیلتر شده برای آژانس کاربر) ========================

export const downloadExcelReport = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ دریافت فقط مشاوران زیرمجموعهٔ آژانس جاری
    const userId = req.user!._id;
    const agents = (await Agent.find({ agencyId: userId }).lean()) as any[];

    const agentsWithDetails = await Promise.all(
      agents.map(async (agent: any) => {
        const propertiesCount = await Ad.countDocuments({
          $or: [{ userId: agent._id }, { agentId: agent._id }],
        });
        return {
          ...agent,
          propertiesCount,
        };
      }),
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("گزارش کارشناسان", {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 25 },
    });

    sheet.columns = [
      { key: "rowNum", width: 10 },
      { key: "fullName", width: 28 },
      { key: "phone", width: 20 },
      { key: "nationalCode", width: 18 },
      { key: "status", width: 16 },
      { key: "propertiesCount", width: 16 },
    ];

    sheet.mergeCells("A1:F2");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "گزارش جامع وضعیت کارشناسان آژانس";
    titleCell.font = {
      name: "Tahoma",
      size: 14,
      bold: true,
      color: { argb: "FF000000" },
    };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.border = {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
    };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "ردیف",
      "نام و نام خانوادگی",
      "شماره تماس",
      "کد ملی",
      "وضعیت",
      "تعداد املاک",
    ]);
    headerRow.font = {
      name: "Tahoma",
      bold: true,
      size: 11,
      color: { argb: "FF000000" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAEAEA" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    agentsWithDetails.forEach((agent: any, index: number) => {
      const row = sheet.addRow([
        index + 1,
        `${agent.firstName || ""} ${agent.lastName || ""}`.trim() || "—",
        agent.phone || "—",
        agent.nationalCode || "—",
        agent.status === "active" ? "فعال" : "غیرفعال",
        agent.propertiesCount || 0,
      ]);

      row.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
      row.alignment = { vertical: "middle" };

      [1, 3, 4, 5, 6].forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colIdx === 6 && typeof cell.value === "number") {
          cell.numFmt = "#,##0";
        }
      });
    });

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF888888" } },
      left: { style: "thin", color: { argb: "FF888888" } },
      bottom: { style: "thin", color: { argb: "FF888888" } },
      right: { style: "thin", color: { argb: "FF888888" } },
    };

    for (let R = 4; R <= agentsWithDetails.length + 4; ++R) {
      for (let C = 1; C <= 6; ++C) {
        sheet.getCell(R, C).border = borderStyle;
      }
    }

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Report",
      description: `دانلود گزارش اکسل کارشناسان توسط کاربر ${req.user?.firstName || req.user?.phone || "ناشناس"}`,
      req,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=agents-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel generation error:", error);
    res.status(500).json({ success: false, message: "خطا در تولید فایل اکسل" });
  }
};

// ======================== PDF (فیلتر شده برای آژانس کاربر) ========================

export const downloadPdfReport = async (req: AuthRequest, res: Response) => {
  try {
    // ۱) تنظیم مسیر فایل‌ها
    const assetsDir = path.join(process.cwd(), "assets");
    const fontsDir = path.join(assetsDir, "fonts");
    const regularFontPath = path.join(fontsDir, "Vazirmatn-Regular.ttf");
    const boldFontPath = path.join(fontsDir, "Vazirmatn-Bold.ttf");
    const watermarkPath = path.join(assetsDir, "watermark.png");

    if (!fs.existsSync(regularFontPath)) {
      throw new Error(`فایل فونت در مسیر یافت نشد: ${regularFontPath}`);
    }

    const finalBoldPath = fs.existsSync(boldFontPath)
      ? boldFontPath
      : regularFontPath;

    // ✅ دریافت فقط مشاوران زیرمجموعهٔ آژانس جاری
    const userId = req.user!._id;
    const agents = (await Agent.find({ agencyId: userId }).lean()) as any[];

    const agentsWithDetails = await Promise.all(
      agents.map(async (agent: any) => {
        const propertiesCount = await Ad.countDocuments({
          $or: [{ userId: agent._id }, { agentId: agent._id }],
        });
        return {
          ...agent,
          propertiesCount,
        };
      }),
    );

    const totalAgents = agentsWithDetails.length;
    const activeAgents = agentsWithDetails.filter(
      (a: any) => a.status === "active",
    ).length;
    const totalProperties = agentsWithDetails.reduce(
      (sum: number, a: any) => sum + (a.propertiesCount || 0),
      0,
    );

    // ۳) تنظیمات ساخت صفحه PDF
    const pageW = 595;
    const pageH = 842;
    const margin = 40;
    const rightEdge = pageW - margin;
    const contentWidth = pageW - 2 * margin;

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: { Title: "گزارش کارشناسان", Author: "آژانس املاک" },
    });

    doc.registerFont("Vazirmatn", regularFontPath);
    doc.registerFont("Vazirmatn-Bold", finalBoldPath);

    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Report",
      description: `دانلود گزارش PDF کارشناسان توسط کاربر ${req.user?.firstName || req.user?.phone || "ناشناس"}`,
      req,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=agents-report.pdf",
    );
    doc.pipe(res);

    /** تابع عمومی رندر متن راست‌چین دقیق (اعداد انگلیسی) */
    const drawRtlText = (
      text: string | number,
      rightX: number,
      y: number,
      opts: { fontSize?: number; bold?: boolean; color?: string } = {},
    ) => {
      const font = opts.bold ? "Vazirmatn-Bold" : "Vazirmatn";
      doc
        .font(font)
        .fontSize(opts.fontSize || 10)
        .fillColor(opts.color || "#000000");

      const formattedText = fixPersianSmart(text);
      const textWidth = doc.widthOfString(formattedText);

      doc.text(formattedText, rightX - textWidth, y, {
        lineBreak: false,
      });
    };

    // --- هدر سازمانی ---
    drawRtlText("گزارش وضعیت کارشناسان آژانس", rightEdge, margin, {
      fontSize: 16,
      bold: true,
    });

    const todayStr = getFormattedPersianDate();
    const timeStr = getFormattedPersianTime();

    drawRtlText(`تاریخ: ${todayStr}`, rightEdge, margin + 35, { fontSize: 9 });
    drawRtlText(`ساعت: ${timeStr}`, rightEdge, margin + 50, { fontSize: 9 });

    doc
      .moveTo(margin, margin + 70)
      .lineTo(rightEdge, margin + 70)
      .lineWidth(2)
      .stroke("#000000");

    // --- کادر خلاصه وضعیت ---
    const summaryY = margin + 90;
    drawRtlText("خلاصه وضعیت:", rightEdge, summaryY, {
      fontSize: 12,
      bold: true,
    });

    const boxY = summaryY + 22;
    const boxH = 60;
    doc.rect(margin, boxY, contentWidth, boxH).lineWidth(1).stroke("#666666");

    const colWidth = contentWidth / 3;
    doc
      .moveTo(margin + colWidth, boxY)
      .lineTo(margin + colWidth, boxY + boxH)
      .lineWidth(0.5)
      .stroke("#999999");
    doc
      .moveTo(margin + 2 * colWidth, boxY)
      .lineTo(margin + 2 * colWidth, boxY + boxH)
      .lineWidth(0.5)
      .stroke("#999999");

    const drawSummaryItem = (
      xCenter: number,
      label: string,
      value: string | number,
    ) => {
      doc.font("Vazirmatn").fontSize(10).fillColor("#333333");
      const fixedLabel = fixPersianSmart(label);
      const labelW = doc.widthOfString(fixedLabel);
      doc.text(fixedLabel, xCenter - labelW / 2, boxY + 12, {
        lineBreak: false,
      });

      doc.font("Vazirmatn-Bold").fontSize(14).fillColor("#000000");
      const fixedValue = fixPersianSmart(value);
      const valueW = doc.widthOfString(fixedValue);
      doc.text(fixedValue, xCenter - valueW / 2, boxY + 32, {
        lineBreak: false,
      });
    };

    drawSummaryItem(
      margin + 2.5 * colWidth,
      "کل کارشناسان",
      totalAgents.toLocaleString("en-US"),
    );
    drawSummaryItem(
      margin + 1.5 * colWidth,
      "کارشناسان فعال",
      activeAgents.toLocaleString("en-US"),
    );
    drawSummaryItem(
      margin + 0.5 * colWidth,
      "مجموع املاک",
      totalProperties.toLocaleString("en-US"),
    );

    // --- جدول تفکیک کارشناسان ---
    let tableY = boxY + boxH + 35;
    drawRtlText("لیست تفکیکی کارشناسان:", rightEdge, tableY, {
      fontSize: 12,
      bold: true,
    });

    tableY += 22;
    const colXs = [
      rightEdge,
      rightEdge - 35,
      rightEdge - 200,
      rightEdge - 320,
      rightEdge - 410,
    ];

    doc
      .rect(margin, tableY, contentWidth, 25)
      .fillAndStroke("#F5F5F5", "#333333");

    const headers = [
      "ردیف",
      "نام و نام خانوادگی",
      "شماره تماس",
      "وضعیت",
      "تعداد املاک",
    ];
    headers.forEach((h, i) => {
      drawRtlText(h, colXs[i] - 10, tableY + 6, { fontSize: 10, bold: true });
    });

    let rowY = tableY + 25;

    const drawTableGrid = (yStart: number, yEnd: number) => {
      doc
        .moveTo(margin, yStart)
        .lineTo(margin, yEnd)
        .lineWidth(1)
        .stroke("#333333");
      doc.moveTo(colXs[4], yStart).lineTo(colXs[4], yEnd).stroke();
      doc.moveTo(colXs[3], yStart).lineTo(colXs[3], yEnd).stroke();
      doc.moveTo(colXs[2], yStart).lineTo(colXs[2], yEnd).stroke();
      doc.moveTo(colXs[1], yStart).lineTo(colXs[1], yEnd).stroke();
      doc.moveTo(rightEdge, yStart).lineTo(rightEdge, yEnd).stroke();
    };

    agentsWithDetails.forEach((agent: any, idx: number) => {
      if (rowY > pageH - 90) {
        drawTableGrid(tableY, rowY);
        doc.addPage();
        rowY = margin;
        tableY = margin;
      }

      const fullName =
        `${agent.firstName || ""} ${agent.lastName || ""}`.trim() || "—";
      const statusStr = agent.status === "active" ? "فعال" : "غیرفعال";

      drawRtlText(idx + 1, colXs[0] - 12, rowY + 7);
      drawRtlText(fullName, colXs[1] - 10, rowY + 7);
      drawRtlText(agent.phone || "—", colXs[2] - 10, rowY + 7);
      drawRtlText(statusStr, colXs[3] - 10, rowY + 7);
      drawRtlText(
        (agent.propertiesCount || 0).toLocaleString("en-US"),
        colXs[4] - 10,
        rowY + 7,
      );

      doc
        .moveTo(margin, rowY + 25)
        .lineTo(rightEdge, rowY + 25)
        .lineWidth(1)
        .stroke("#333333");
      rowY += 25;
    });

    drawTableGrid(tableY, rowY);

    // --- واتر مارک و فوتر ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      if (fs.existsSync(watermarkPath)) {
        doc.save();
        doc.opacity(0.85);
        const wmWidth = 110;
        const wmX = margin;
        const wmY = pageH - margin - 75;
        doc.image(watermarkPath, wmX, wmY, { width: wmWidth });
        doc.restore();
      }

      const footerY = pageH - 35;
      doc
        .moveTo(margin, footerY - 10)
        .lineTo(rightEdge, footerY - 10)
        .lineWidth(0.5)
        .stroke("#000000");

      drawRtlText(
        "این گزارش به صورت سیستمی تولید شده و فاقد مهر برجسته می‌باشد.",
        pageW / 2 + 120,
        footerY,
        {
          fontSize: 8,
          color: "#333333",
        },
      );

      if (range.count > 1) {
        drawRtlText(`صفحه ${i + 1} از ${range.count}`, rightEdge, footerY, {
          fontSize: 8,
          color: "#555555",
        });
      }
    }

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "خطا در تولید فایل PDF" });
    }
  }
};