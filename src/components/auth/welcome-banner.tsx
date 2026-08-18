type WelcomeBannerProps = {
  show: boolean;
};

export function WelcomeBanner({ show }: WelcomeBannerProps) {
  if (!show) return null;

  return (
    <div
      className="rounded-xl border border-accent/40 bg-secondary/60 px-4 py-3 text-sm text-primary"
      role="status"
    >
      Welcome to NailsByGabs! You&apos;re signed in and can book open
      appointment slots below.
    </div>
  );
}
