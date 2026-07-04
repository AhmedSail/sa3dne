import { Card } from "@/components/ui/card";
import React from "react";
import SignUpView from "@/src/modules/auth/ui/view/signUpView";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const Signup = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignUpView />;
};

export default Signup;
