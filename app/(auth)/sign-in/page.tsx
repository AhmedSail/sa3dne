import { Card } from "@/components/ui/card";
import React from "react";
import SignInView from "@/src/modules/auth/ui/view/signInView";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const Signin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignInView />;
};

export default Signin;
