import TrackingForm from "@/components/Feedback/TrackingForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تتبع حالة الطلب",
};

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10">
      <TrackingForm />
    </div>
  );
}
