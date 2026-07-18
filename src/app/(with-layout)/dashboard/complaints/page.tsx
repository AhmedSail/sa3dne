import { getComplaints } from "@/lib/actions/complaints";
import { Metadata } from "next";
import ComplaintsClient from "./_components/ComplaintsClient";

export const metadata: Metadata = {
  title: "الشكاوى والمقترحات",
};

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : undefined;
  const type = typeof resolvedParams.type === "string" ? resolvedParams.type : undefined;
  const keyword = typeof resolvedParams.keyword === "string" ? resolvedParams.keyword : undefined;

  let complaints: any[] = [];
  let error = null;

  try {
    complaints = await getComplaints({ status, type, keyword });
  } catch (err: any) {
    error = err.message;
  }

  return (
    <ComplaintsClient
      complaints={complaints}
      error={error}
      searchParams={{ keyword, type, status }}
    />
  );
}
