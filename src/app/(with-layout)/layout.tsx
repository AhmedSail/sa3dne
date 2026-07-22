import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { type PropsWithChildren } from "react";

export default async function WithLayout({ children }: PropsWithChildren) {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  const userRole = session?.user?.role ?? "user";

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} />

      <div className="flex-1 flex flex-col min-w-0 bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-(--breakpoint-2xl) overflow-x-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
