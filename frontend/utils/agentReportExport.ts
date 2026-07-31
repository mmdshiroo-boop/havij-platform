import * as XLSX from "xlsx";

// ==================== Types ====================
export interface AgentReportStats {
  properties: {
    total: number;
    active: number;
    sold: number;
    pending: number;
    expired: number;
  };
  views: {
    total: number;
    averagePerProperty: number;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    commission: number;
    averagePerSale: number;
  };
  topProperties: Array<{
    id: string;
    title: string;
    views: number;
    status: string;
  }>;
}

// ==================== توابع کمکی ====================
function getPersianDate(): string {
  return new Date().toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toPersianNum(num?: number): string {
  return (num ?? 0).toLocaleString("fa-IR");
}

function getStatusBadgeClass(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case "active":
      return { label: "فعال", className: "badge-green" };
    case "sold":
      return { label: "فروش رفته", className: "badge-blue" };
    case "pending":
      return { label: "در انتظار", className: "badge-yellow" };
    case "expired":
      return { label: "منقضی", className: "badge-red" };
    default:
      return { label: status || "نامشخص", className: "badge-gray" };
  }
}

// ==================== دانلود Excel برای Agent ====================
export function downloadAgentExcel(stats: AgentReportStats) {
  const persianDate = getPersianDate();

  // ساخت آرایه داده‌ها (درج اعداد به صورت عددی برای پشتیبانی از فرمول‌نویسی در اکسل)
  const data: Array<Array<string | number>> = [
    ["📊 گزارش عملکرد آژانس", ""],
    ["", ""],
    ["تاریخ تهیه:", persianDate],
    ["", ""],
    ["─────────────────────────────────", ""],
    ["🏠 آمار املاک", ""],
    ["کل املاک", stats?.properties?.total ?? 0],
    ["فعال", stats?.properties?.active ?? 0],
    ["فروش رفته", stats?.properties?.sold ?? 0],
    ["در انتظار تأیید", stats?.properties?.pending ?? 0],
    ["منقضی شده", stats?.properties?.expired ?? 0],
    ["", ""],
    ["👁️ آمار بازدیدها", ""],
    ["کل بازدیدها", stats?.views?.total ?? 0],
    ["میانگین بازدید هر ملک", stats?.views?.averagePerProperty ?? 0],
    ["", ""],
    ["🎯 آمار لیدها", ""],
    ["کل لیدها", stats?.leads?.total ?? 0],
    ["لیدهای جدید", stats?.leads?.new ?? 0],
    ["لیدهای تبدیل شده", stats?.leads?.converted ?? 0],
    ["نرخ تبدیل (درصد)", stats?.leads?.conversionRate ?? 0],
    ["", ""],
    ["💰 آمار درآمد (تومان)", ""],
    ["کل درآمد", stats?.revenue?.total ?? 0],
    ["کمیسیون", stats?.revenue?.commission ?? 0],
    ["میانگین فروش هر ملک", Math.round(stats?.revenue?.averagePerSale ?? 0)],
  ];

  // افزودن املاک برتر
  if (stats?.topProperties && stats.topProperties.length > 0) {
    data.push(["", ""]);
    data.push(["🏆 املاک برتر (بیشترین بازدید)", ""]);
    stats.topProperties.forEach((prop, i) => {
      data.push([`${i + 1}. ${prop.title}`, prop.views ?? 0]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // تنظیم عرض ستون‌ها
  ws["!cols"] = [{ wch: 42 }, { wch: 22 }];

  const wb = XLSX.utils.book_new();

  // 💡 تنظیم راست‌چین‌سازی نیتیو برای شیت اکسل
  wb.Workbook = {
    Views: [{ RTL: true }],
  };

  XLSX.utils.book_append_sheet(wb, ws, "گزارش آژانس");

  const dateStr = new Date().toLocaleDateString("fa-IR").replace(/\//g, "-");
  const fileName = `گزارش-عملکرد-آژانس-${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

// ==================== دانلود PDF برای Agent ====================
export function downloadAgentPDF(stats: AgentReportStats) {
  const persianDate = getPersianDate();
  const dateStr = new Date().toLocaleDateString("fa-IR").replace(/\//g, "-");
  const pageTitle = `گزارش-عملکرد-آژانس-${dateStr}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${pageTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
          background: #ffffff;
          color: #1e293b;
          direction: rtl;
          padding: 36px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #f97316;
          padding-bottom: 20px;
          margin-bottom: 28px;
        }

        .logo-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 22px;
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #ea580c;
        }

        .meta {
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #ea580c;
          border-right: 4px solid #f97316;
          padding-right: 10px;
          margin-bottom: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .stat-card.highlight {
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          color: #ffffff;
        }

        .stat-card.highlight .stat-label,
        .stat-card.highlight .stat-value {
          color: #ffffff;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        th {
          background: #f97316;
          color: #ffffff;
          padding: 10px 14px;
          text-align: right;
          font-weight: 600;
        }

        td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          text-align: right;
        }

        tr:nth-child(even) td {
          background: #f8fafc;
        }

        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-yellow { background: #fef9c3; color: #a16207; }
        .badge-red { background: #fee2e2; color: #b91c1c; }
        .badge-gray { background: #f1f5f9; color: #475569; }

        .footer {
          margin-top: 36px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
        }

        @media print {
          body { padding: 10mm; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="logo-bar">
          <div class="logo-icon">📊</div>
          <h1>گزارش عملکرد آژانس</h1>
        </div>
        <p class="meta">تاریخ تهیه: ${persianDate}</p>
      </div>

      <!-- آمار کلی -->
      <div class="section">
        <div class="section-title">📈 آمار کلی عملکرد</div>
        <div class="stats-grid">
          <div class="stat-card highlight">
            <div class="stat-label">کل املاک</div>
            <div class="stat-value">${toPersianNum(stats?.properties?.total)}</div>
          </div>
          <div class="stat-card highlight">
            <div class="stat-label">کل بازدیدها</div>
            <div class="stat-value">${toPersianNum(stats?.views?.total)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">کل لیدها</div>
            <div class="stat-value">${toPersianNum(stats?.leads?.total)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">نرخ تبدیل</div>
            <div class="stat-value">${toPersianNum(stats?.leads?.conversionRate)}٪</div>
          </div>
        </div>
      </div>

      <!-- جدول جزئیات املاک -->
      <div class="section">
        <div class="section-title">🏠 جزئیات املاک</div>
        <table>
          <thead>
            <tr><th>وضعیت</th><th>تعداد</th></tr>
          </thead>
          <tbody>
            <tr><td>فعال</td><td>${toPersianNum(stats?.properties?.active)}</td></tr>
            <tr><td>فروش رفته</td><td>${toPersianNum(stats?.properties?.sold)}</td></tr>
            <tr><td>در انتظار تأیید</td><td>${toPersianNum(stats?.properties?.pending)}</td></tr>
            <tr><td>منقضی شده</td><td>${toPersianNum(stats?.properties?.expired)}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- جدول آمار لیدها -->
      <div class="section">
        <div class="section-title">🎯 آمار لیدها</div>
        <table>
          <thead><tr><th>شاخص</th><th>مقدار</th></tr></thead>
          <tbody>
            <tr><td>کل لیدها</td><td>${toPersianNum(stats?.leads?.total)}</td></tr>
            <tr><td>لیدهای جدید</td><td>${toPersianNum(stats?.leads?.new)}</td></tr>
            <tr><td>لیدهای تبدیل شده</td><td>${toPersianNum(stats?.leads?.converted)}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- جدول آمار درآمد -->
      <div class="section">
        <div class="section-title">💰 آمار درآمد</div>
        <table>
          <thead><tr><th>شاخص</th><th>مقدار</th></tr></thead>
          <tbody>
            <tr><td>کل درآمد</td><td>${toPersianNum(stats?.revenue?.total)} تومان</td></tr>
            <tr><td>کمیسیون</td><td>${toPersianNum(stats?.revenue?.commission)} تومان</td></tr>
            <tr><td>میانگین فروش هر ملک</td><td>${toPersianNum(Math.round(stats?.revenue?.averagePerSale ?? 0))} تومان</td></tr>
          </tbody>
        </table>
      </div>

      ${
        stats?.topProperties && stats.topProperties.length > 0
          ? `
      <div class="section">
        <div class="section-title">🏆 املاک برتر (بیشترین بازدید)</div>
        <table>
          <thead><tr><th>ردیف</th><th>عنوان ملک</th><th>تعداد بازدید</th><th>وضعیت</th></tr></thead>
          <tbody>
            ${stats.topProperties
              .map((prop, i) => {
                const badge = getStatusBadgeClass(prop.status);
                return `
                  <tr>
                    <td>${toPersianNum(i + 1)}</td>
                    <td>${prop.title || "بدون عنوان"}</td>
                    <td>${toPersianNum(prop.views)}</td>
                    <td><span class="badge ${badge.className}">${badge.label}</span></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      <div class="footer">
        این گزارش به صورت خودکار توسط سیستم مدیریت تهیه شده است
        &nbsp;|&nbsp; ${persianDate}
      </div>

    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "لطفاً اجازه باز شدن پنجره‌های پاپ‌آپ (Pop-up) را در مرورگر خود بدهید.",
    );
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // 💡 انتظار هوشمند برای لود کامل فونت‌ها قبل از باز شدن دیالوگ پرینت
  printWindow.onload = () => {
    if (printWindow.document.fonts) {
      printWindow.document.fonts.ready.then(() => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 200);
      });
    } else {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 600);
    }
  };
}
