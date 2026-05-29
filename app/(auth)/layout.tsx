import Image from "next/image";
import React from "react";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page min-h-screen w-full overflow-y-auto bg-[#F5F8FA] px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] shadow-xl lg:grid-cols-[minmax(520px,1.12fr)_minmax(0,0.88fr)]">
        <aside className="relative hidden overflow-hidden bg-[#031C33] px-12 py-10 text-white lg:flex lg:items-center lg:justify-center">
          <Image
            src="/brand/auth-ocean-background.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            quality={100}
            className="object-cover object-[35%_center]"
            priority
          />
          <div className="absolute inset-0 bg-[#031C33]/18" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#031C33]/20 via-[#041C34]/0 to-[#020D18]/36" />

          <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col items-center text-center">
            <div className="flex w-full max-w-[232px] justify-center">
              <div className="overflow-hidden rounded-full border border-white/50 bg-white shadow-xl shadow-blue-950/20">
                <Image
                  src="/brand/defiance-logo.jpg"
                  width={232}
                  height={232}
                  alt="Defiance Finance logo"
                  className="aspect-square w-full rounded-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="mt-9 w-full">
              <h1
                className={`${dancingScript.className} mx-auto max-w-[560px] text-center text-[clamp(46px,5vw,76px)] font-bold leading-[0.95]`}
              >
                <span className="block">Your money,</span>
                <span className="mt-1 block whitespace-nowrap text-[#60A5FA]">
                  finally in one place
                </span>
              </h1>
              <p className="mx-auto mt-8 max-w-[580px] text-17 leading-8 text-blue-50">
                Transfer money, check balances, track bills, manage budgets,
                organize receipts, and get smart financial help without jumping
                between banking apps.
              </p>
            </div>
          </div>
        </aside>

        <div className="auth-panel relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8FBFF] via-[#EEF7FF] to-[#FFFFFF] px-5 py-8 sm:px-10">
          <div className="relative z-10 w-full max-w-lg">{children}</div>
        </div>
      </section>
    </main>
  );
}
