import { GlassButton, GlassCard, FormattedText, Sparkles, Moon, MimiAvatar, MimiLoadingAvatar } from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif text-[var(--foreground)]">
            MimiVibe
          </h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            AI-Powered Tarot Reading Application
          </p>
        </div>

        {/* Avatar Feature Section */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold mb-2 text-center">Meet Mimi</h2>
          <p className="text-center text-[var(--muted-foreground)] mb-6">
            Your AI tarot guide, here to illuminate your path
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Normal Avatar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center text-[var(--accent)]">
                Ready for Reading
              </h3>
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 rounded-full blur-2xl"></div>
                <div className="relative w-full h-full">
                  <MimiAvatar />
                </div>
              </div>
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Contemplative and focused
              </p>
            </div>

            {/* Loading Avatar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center text-[var(--primary)]">
                Consulting the Cards
              </h3>
              <div className="w-64 h-64 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--primary)]/20 rounded-full blur-2xl"></div>
                <div className="relative w-full h-full">
                  <MimiLoadingAvatar />
                </div>
              </div>
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Processing your reading
              </p>
            </div>
          </div>
        </GlassCard>

        {/* UI Components Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center text-[var(--foreground)]">
            UI Components
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4">Button Variants</h3>
              <div className="space-y-3">
                <GlassButton className="w-full">Primary Button</GlassButton>
                <GlassButton variant="outline" className="w-full">Outline Button</GlassButton>
                <GlassButton variant="ghost" className="w-full">Ghost Button</GlassButton>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-xl font-semibold mb-4">Icon Examples</h3>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <Sparkles className="w-10 h-10 text-[var(--primary)] mx-auto mb-2" />
                  <span className="text-xs text-[var(--muted-foreground)]">Magic</span>
                </div>
                <div className="text-center">
                  <Moon className="w-10 h-10 text-[var(--accent)] mx-auto mb-2" />
                  <span className="text-xs text-[var(--muted-foreground)]">Mystery</span>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="text-xl font-semibold mb-4">Formatted Text</h3>
            <p className="text-lg">
              <FormattedText text="Mimi helps you discover **hidden truths** and **new perspectives** through the ancient wisdom of tarot." />
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
