import Signin from "@/components/Auth/Signin";
import { AuthBanner } from "@/components/Auth/AuthBanner";
import { AuthPageHeading } from "@/components/Auth/AuthPageHeading";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-wrap items-center">
      <div className="w-full xl:w-1/2">
        <div className="mx-auto w-full max-w-[570px] p-4 sm:p-12.5 xl:p-15">
          <div className="mb-8 text-center xl:hidden">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo/logo.png"
                alt="Sa3dne"
                width={160}
                height={160}
                className="mx-auto object-contain"
              />
            </Link>
            <AuthPageHeading type="signin" withSubtitle />
          </div>
          <div className="hidden xl:block mb-8 text-center">
            <AuthPageHeading type="signin" />
          </div>
          <Signin />
        </div>
      </div>

      <div className="hidden w-full p-6 xl:block xl:w-1/2">
        <AuthBanner type="signin" />
      </div>
    </div>
  );
}
