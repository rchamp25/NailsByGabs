"use client";

import { usePathname } from "next/navigation";

type PageMotionProps = {
  children: React.ReactNode;
};

export function PageMotion({ children }: PageMotionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
