import { GlassButton, GlassCard, FormattedText, Sparkles, Moon } from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-serif text-center text-[var(--foreground)]">
          MimiVibe - UI Components Extracted
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
            <div className="space-y-3">
              <GlassButton className="w-full">Primary Button</GlassButton>
              <GlassButton variant="outline" className="w-full">Outline Button</GlassButton>
              <GlassButton variant="ghost" className="w-full">Ghost Button</GlassButton>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">Icon Examples</h2>
            <div className="flex justify-center gap-4">
              <Sparkles className="w-8 h-8 text-[var(--primary)]" />
              <Moon className="w-8 h-8 text-[var(--accent)]" />
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Formatted Text</h2>
          <p className="text-lg">
            <FormattedText text="This is **bold text** within a regular sentence." />
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
