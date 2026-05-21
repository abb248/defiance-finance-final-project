import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-max text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/icons/logo.svg"
            width={80}
            height={80}
            alt="Defiance Finance logo"
            className="opacity-80 drop-shadow-md"
          />
        </div>
        <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">404 error</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Page not found.
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-105 rounded-xl px-6 py-5">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
