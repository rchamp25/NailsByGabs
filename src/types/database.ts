import type { AppointmentLocation } from "@/lib/appointment-locations";

export type UserRole = "owner" | "client";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  appointments_booked: number;
  appointments_completed: number;
  /** Migration 017; undefined until it is applied. */
  loyalty_member?: boolean;
  loyalty_member_since?: string | null;
};

export type BookingEventType =
  | "booked"
  | "cancelled"
  | "released"
  | "completed"
  | "deleted";

export type BookingSource = "platform" | "manual";

export type { AppointmentLocation };

export type AppointmentSlot = {
  id: string;
  start_at: string;
  end_at: string;
  status: "open" | "booked";
  location: AppointmentLocation;
  booked_by: string | null;
  booked_name: string | null;
  notes: string | null;
  booking_updated_at: string | null;
  completed_at: string | null;
  created_at: string;
  /** Migration 018; reserved for loyalty members until 24h before. Undefined before 018. */
  members_only?: boolean;
};

export type SlotWithBooker = AppointmentSlot & {
  booker: Pick<Profile, "full_name"> | null;
};
