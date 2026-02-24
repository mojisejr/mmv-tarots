export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-12 border-t border-white/10 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-foreground/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="font-medium text-foreground">MimiVibe Wellness Studio</p>
        </div>

        <div className="mt-3 space-y-1 text-xs text-foreground/70">
          <p>Contact: support@mmv-tarots.com</p>
          <p>For entertainment and personal reflection purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
