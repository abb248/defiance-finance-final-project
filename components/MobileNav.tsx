"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarLinks } from "../constants";
import { cn } from "../lib/utilsz";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from ".,/ui/sheet";

type MobileNavProps = {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger asChild>
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>

        <SheetContent side="left" className="border-none bg-white">
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-1 px-4"
          >
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="Horizon logo"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              Horizon
            </h1>
          </Link>

          <div className="mobilenav-sheet">
            <nav className="flex h-full flex-col gap-6 pt-16 text-white">
              {sidebarLinks.map((item) => {
                const isActive =
                  pathname === item.route ||
                  pathname.startsWith(`${item.route}/`);

                return (
                  <SheetClose asChild key={item.route}>
                    <Link
                      href={item.route}
                      className={cn("mobilenav-sheet_close w-full", {
                        "bg-bank-gradient": isActive,
                      })}
                    >
                      <Image
                        src={item.imgURL}
                        alt={item.label}
                        width={20}
                        height={20}
                        className={cn({
                          "brightness-[3] invert-0": isActive,
                        })}
                      />

                      <p
                        className={cn("text-16 font-semibold text-black-2", {
                          "text-white": isActive,
                        })}
                      >
                        {item.label}
                      </p>
                    </Link>
                  </SheetClose>
                );
              })}

              <div className="mt-auto px-4 text-black-2">
                {user?.firstName ? `${user.firstName} ${user?.lastName ?? ""}` : "USER"}
              </div>
            </nav>

            <div className="px-4 pb-6 text-black-2">FOOTER</div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;