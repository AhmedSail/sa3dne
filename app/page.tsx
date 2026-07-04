import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { session } from "@/src/db/schema";
import HomeView from "@/src/modules/home/ui/view/home-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <HomeView />;
};

export default page;
