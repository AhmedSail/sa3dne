"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/language-context";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
}

export default function ExportButtons({ data, filename, columns }: ExportButtonsProps) {
  const { t, dir } = useLanguage();

  const handleExportCSV = () => {
    // We generate an HTML table and save it as .xls.
    // Excel will natively parse this and maintain RTL direction, column widths, and formatting.
    
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${t("exportSheetName")}</x:Name>
                <x:WorksheetOptions>
                  ${dir === "rtl" ? "<x:DisplayRightToLeft/>" : ""}
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; direction: ${dir}; }
          th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: center; }
          td { border: 1px solid #ddd; padding: 8px; text-align: center; mso-number-format:"\\@"; }
        </style>
      </head>
      <body dir="${dir}">
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(item => {
      tableHtml += "<tr>";
      columns.forEach(col => {
        let val = item[col.key];
        if (val === null || val === undefined) val = "";
        
        // Convert boolean to readable text
        if (typeof val === 'boolean') {
          val = val ? t("yes") : t("no");
        }
        
        let strVal = String(val);
        // Clean up any weird invisible characters if present
        strVal = strVal.replace(/\r?\n|\r/g, ' '); 

        tableHtml += `<td>${strVal}</td>`;
      });
      tableHtml += "</tr>";
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-3 print:hidden">
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-colors"
      >
        <span>📥</span>
        {t("exportExcel")}
      </button>
    </div>
  );
}
