import { useEffect, useMemo, useState } from 'react';

interface TourStep {
  title: string;
  body: string;
  targetId?: string;
}

const steps: TourStep[] = [
  { title: 'Welcome', body: 'This editor keeps spec.md as the source of truth while giving you a visual editing surface.' },
  { title: 'Toolbar overview', body: 'The toolbar is where you open files, create with AI, validate, preview, and access settings.', targetId: 'toolbar' },
  { title: 'Create with AI', body: 'Use this to generate a decision tree or start from a template.', targetId: 'create-ai-button' },
  { title: 'Document editor', body: 'Click text directly to edit the generated spec.', targetId: 'document-editor' },
  { title: 'Question blocks', body: 'The blue cards are question nodes and branching logic.', targetId: 'question-block' },
  { title: 'Result blocks', body: 'The green cards are result recommendations and guidance content.', targetId: 'result-block' },
  { title: 'Compile and show output', body: 'Compile to validate the deterministic HTML output and open the folder that contains the real HTML file.', targetId: 'preview-button' },
];

export function OnboardingTour({
  open,
  onFinish,
}: {
  open: boolean;
  onFinish: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[stepIndex];

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }
    const updateRect = () => {
      if (!step.targetId) {
        setRect(null);
        return;
      }
      const element = document.querySelector(`[data-tour-id="${step.targetId}"]`);
      setRect(element instanceof HTMLElement ? element.getBoundingClientRect() : null);
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open, step.targetId]);

  const cardStyle = useMemo(() => {
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as const;
    }
    const margin = 20;
    const preferredTop = rect.bottom + 16;
    const fitsBelow = preferredTop + 220 < window.innerHeight;
    const top = fitsBelow ? preferredTop : Math.max(margin, rect.top - 236);
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - 380);
    return { top: `${top}px`, left: `${left}px` };
  }, [rect]);

  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="onboarding-tour-title" className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-slate-950/80" />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl border border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.78)]"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      ) : null}
      <div className="absolute z-[91] w-[min(360px,calc(100vw-32px))] rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl" style={cardStyle}>
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-emerald-300">Step {stepIndex + 1} of {steps.length}</div>
        <h3 id="onboarding-tour-title" className="mb-2 text-lg font-semibold text-slate-100">{step.title}</h3>
        <p className="mb-5 text-sm leading-6 text-slate-300">{step.body}</p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (stepIndex === 0) {
                onFinish();
                return;
              }
              setStepIndex((current) => current - 1);
            }}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
          >
            {stepIndex === 0 ? 'Skip' : 'Back'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepIndex === steps.length - 1) {
                onFinish();
                return;
              }
              setStepIndex((current) => current + 1);
            }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}