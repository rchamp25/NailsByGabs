export type UserRole = "owner" | "client";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export type AppointmentSlot = {
  id: string;
  start_at: string;
  end_at: string;
  status: "open" | "booked";
  booked_by: string | null;
  booked_name: string | null;
  notes: string | null;
  created_at: string;
};

export type SlotWithBooker = AppointmentSlot & {
  booker: Pick<Profile, "full_name"> | null;
};
