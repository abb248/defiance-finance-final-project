import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#F5F8FA] px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <aside className="hidden bg-[#0F3554] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-white p-2 shadow-lg">
                <Image
                  src="/brand/defiance-logo.jpg"
                  width={56}
                  height={56}
                  alt="Defiance Finance logo"
                  className="size-14 rounded-full object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-24 font-bold">Defiance Finance</p>
                <p className="text-13 font-medium text-blue-100">
                  Secure digital banking
                </p>
              </div>
            </div>

            <div className="mt-14">
              <h1 className="max-w-sm text-36 font-semibold leading-tight">
                Manage money with clearer controls.
              </h1>
              <p className="mt-4 max-w-md text-16 leading-7 text-blue-100">
                Review accounts, transfers, budgets, subscriptions, and security
                settings from one dashboard.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-14 text-blue-50">
            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
              Transfer review and receipts before checkout.
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
              Two-factor authentication and account preferences.
            </div>
          </div>
        </aside>

        <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </section>
    </main>
  );
}
