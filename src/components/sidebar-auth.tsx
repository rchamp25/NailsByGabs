"use client";

import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Profile } from "@/types/database";

type SidebarAuthProps = {
  profile: Profile | null;
  email?: string;
};

export function SidebarAuth({ profile, email }: SidebarAuthProps) {
  if (!profile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Sign in">
            <Link href="/auth/login">
              <LogIn className="text-gold" />
              <span>Sign in</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Sign up">
            <Link href="/auth/signup">
              <User className="text-gold" />
              <span>Sign up</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
      <p className="text-muted-foreground truncate px-2 text-xs group-data-[collapsible=icon]:hidden">
        {profile.full_name || email}
        {profile.role === "owner" && (
          <span className="text-gold ml-1">· Owner</span>
        )}
      </p>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-rose-red w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
        >
          <LogOut className="size-4 text-gold" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </form>
    </div>
  );
}
