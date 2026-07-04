"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  email: z.string().email({ message: "عنوان بريد إلكتروني غير صالح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

export default function SignInView() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    await authClient.signIn.email(
      { email: data.email, password: data.password, callbackURL: "/" },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error?.message ?? "حدث خطأ غير متوقع");
        },
      },
    );
  };

  const onSocial = async (provider: "github" | "google") => {
    setError(null);
    setPending(true);
    await authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/");
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error?.message ?? "حدث خطأ غير متوقع");
        },
      },
    );
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div dir="rtl" className="flex w-full min-h-screen animate-in fade-in duration-700 font-sans">
      <Card className="w-full min-h-screen overflow-hidden p-0 border-0 rounded-none shadow-none bg-card">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-screen">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-8 md:p-12 lg:p-20 flex flex-col justify-center h-full relative"
            >
              <div className="flex flex-col gap-8 w-full max-w-[450px] mx-auto">
                <div className="flex flex-col items-start text-right space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    مرحباً بعودتك
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium">
                    أدخل بياناتك للوصول إلى حسابك في المنصة
                  </p>
                </div>

                <div className="grid gap-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 text-right">
                        <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground">
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            className="bg-background/50 h-12 focus-visible:ring-primary/50 transition-all rounded-xl text-left"
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 text-right">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground">
                            كلمة المرور
                          </FormLabel>
                          <Link
                            href="#"
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            نسيت كلمة المرور؟
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            className="bg-background/50 h-12 focus-visible:ring-primary/50 transition-all rounded-xl text-left"
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!!error && (
                  <Alert className="bg-destructive/15 text-destructive border-none animate-in fade-in slide-in-from-top-2 rounded-xl text-right">
                    <OctagonAlertIcon className="h-4 w-4 ml-2" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}

                <Button
                  disabled={pending}
                  type="submit"
                  className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-md bg-green-600 hover:bg-green-700 text-white"
                >
                  {pending ? <Spinner /> : "تسجيل الدخول"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">
                      أو المتابعة باستخدام
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={() => onSocial("google")}
                    variant="outline"
                    type="button"
                    className="w-full h-12 bg-background/50 hover:bg-background transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl font-medium"
                  >
                    <FaGoogle className="ml-2 h-4 w-4" />
                    جوجل
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground font-medium mt-2">
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/sign-up"
                    className="text-green-600 hover:underline hover:text-green-700 transition-colors font-semibold"
                  >
                    إنشاء حساب مجاناً
                  </Link>
                </div>
              </div>

              <div className="absolute bottom-6 left-0 right-0 text-muted-foreground text-center text-xs text-balance font-medium px-4">
                بالنقر على المتابعة، فإنك توافق على{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  شروط الخدمة
                </a>{" "}
                و{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  سياسة الخصوصية
                </a>
                .
              </div>
            </form>
          </Form>

          <div className="relative hidden md:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-700 to-green-950">
            {/* Decorative background shapes */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse" />
            <div
              className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse"
              style={{ animationDelay: "2s" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center text-white backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl transition-transform hover:scale-105 duration-700 mx-8">
              <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-xl shadow-inner border border-white/20">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="w-[100px] h-[100px] drop-shadow-2xl transition-transform hover:rotate-12 duration-500 brightness-0 invert"
                />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                  مرحباً بك في ساعدني
                </h2>
                <p className="text-green-50 font-medium max-w-[240px] text-balance text-sm opacity-90 leading-relaxed">
                  المنصة الموحدة لإدارة المساعدات وتنسيق العمل الإنساني. انضم إلينا وكن جزءاً من الحل.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
