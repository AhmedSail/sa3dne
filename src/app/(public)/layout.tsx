import { type PropsWithChildren } from "react";
import PublicFooter from "@/components/Public/PublicFooter";
import PublicHeader from "@/components/Public/PublicHeader";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#020d1a]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
