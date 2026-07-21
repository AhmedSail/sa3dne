"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/language-context";

type PropsType = {
  data: { name: string; amount: number }[];
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function NeedLevelChart({ data }: PropsType) {
  const { t, language } = useLanguage();

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    // Colors mapping: Low (Green), Medium (Yellow), High (Orange), Critical (Red)
    colors: ["#22C55E", "#EAB308", "#F97316", "#EF4444"],
    labels: data.map((item) => item.name),
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: (legendName, opts) => {
        const value = opts.w.globals.series[opts.seriesIndex];
        return `${legendName}: ${value}`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: language === "ar" ? "إجمالي المخيمات" : "Total Camps",
              fontSize: "14px",
              fontWeight: "400",
              formatter: () => String(total),
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: "bold",
              formatter: (val) => val,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: "100%",
            height: 320,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: "100%",
            height: 300,
          },
        },
      },
    ],
  };

  return (
    <div className="w-full flex justify-center">
      <Chart
        options={chartOptions}
        series={data.map((item) => item.amount)}
        type="donut"
        width="100%"
        height={320}
      />
    </div>
  );
}
