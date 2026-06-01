type WelcomeBannerProps = {
  show: boolean;
};

export function WelcomeBanner({ show }: WelcomeBannerProps) {
  if (!show) return null;

  return (
    <div
      className="rounded-xl border border-gold/40 bg-pastel-pink/60 px-4 py-3 text-sm text-rose-red-deep"
      role="status"
    >
      Email confirmed — welcome to NailsByGabs! You&apos;re signed in and can
      book open appointment slots below.
    </div>
  );
}
