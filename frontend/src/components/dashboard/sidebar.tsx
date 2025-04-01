"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Contact, Bed, ClipboardList, Home, Heart } from "lucide-react";

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="space-y-1">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={pathname === "/chambers" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/chambers">
                <Bed className="mr-2 h-4 w-4" />
                Chambers
              </Link>
            </Button>
            <Button
              variant={pathname === "/deceased" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/deceased">
                <ClipboardList className="mr-2 h-4 w-4" />
                Deceased Records
              </Link>
            </Button>
            <Button
              variant={pathname === "/services" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/services">
                <Heart className="mr-2 h-4 w-4" />
                Services
              </Link>
            </Button>
            <Button
              variant={pathname === "/next-of-kin" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/next-of-kin">
                <Contact className="mr-2 h-4 w-4" />
                NextOfKin
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
