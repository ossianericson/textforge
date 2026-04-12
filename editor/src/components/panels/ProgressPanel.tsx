import { collectTargetsFromQuestion } from '@/lib/layout';
import { useEditorStore } from '@/store/useEditorStore';

function computeExpectedSteps(spec: NonNullable<ReturnType<typeof useEditorStore.getState>['spec']>) {
  const questionIds = Object.keys(spec.questions);
  const questionIdSet = new Set(questionIds);
  const depths = new Map<string, number>();
  const queue: string[] = questionIdSet.has('q1') ? ['q1'] : questionIds.slice(0, 1);

  if (queue[0]) {
    depths.set(queue[0], 0);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const depth = depths.get(id) ?? 0;
    collectTargetsFromQuestion(spec.questions[id]!).forEach((target) => {
      if (questionIdSet.has(target) && !depths.has(target)) {
        depths.set(target, depth + 1);
        queue.push(target);
      }
    });
  }

  questionIds.forEach((id) => {
    if (!depths.has(id)) {
      depths.set(id, 0);
    }
  });

  const maxDepth = Math.max(...depths.values(), 0);
  const expected: Record<string, number> = {};
  questionIds.forEach((id) => {
    const depth = depths.get(id) ?? 0;
    expected[id] = id === 'q1' ? 0 : maxDepth === 0 ? 80 : Math.round((depth / maxDepth) * 80);
  });
  expected.result = 100;
  return expected;
}

export function ProgressPanel() {
  const { spec, updateProgressStep, toggleProgressPanel } = useEditorStore();

  if (!spec) {
    return null;
  }

  const questionIds = Object.keys(spec.questions).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const expected = computeExpectedSteps(spec);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(3,8,18,0.56)] p-6 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,37,0.94),rgba(12,18,28,0.96))] p-5 shadow-[0_28px_80px_rgba(2,6,14,0.46)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Progress Steps</h2>
            <p className="text-xs text-slate-400">Adjust the progress percentages used by the compiled tree.</p>
          </div>
          <button onClick={toggleProgressPanel} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 transition hover:border-white/15 hover:bg-white/[0.08]">Close</button>
        </div>

        <div className="space-y-2">
          {questionIds.map((id) => {
            const current = spec.progressSteps[id] ?? 0;
            const suggested = expected[id] ?? 0;
            const warn = Math.abs(current - suggested) > 5;
            return (
              <div key={id} className={`grid grid-cols-[100px_1fr_70px] items-center gap-3 rounded-[20px] border px-3 py-3 ${warn ? 'border-amber-300/25 bg-amber-300/10' : 'border-white/10 bg-white/[0.03]'}`}>
                <span className="font-mono text-xs text-slate-300">{id}</span>
                <div className="text-xs text-slate-500">Suggested {suggested}</div>
                <input type="number" min={0} max={100} className="input-sm text-right" value={current} onChange={(event) => updateProgressStep(id, Number(event.target.value))} />
              </div>
            );
          })}

          <div className="grid grid-cols-[100px_1fr_70px] items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-3 py-3">
            <span className="font-mono text-xs text-slate-300">result</span>
            <div className="text-xs text-slate-500">Fixed</div>
            <input className="input-sm text-right" value="100" disabled readOnly />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              Object.entries(expected).forEach(([id, value]) => {
                if (id !== 'result') {
                  updateProgressStep(id, value);
                }
              });
            }}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-xs font-medium text-emerald-50 transition hover:bg-emerald-400/18"
          >
            Auto-suggest
          </button>
        </div>
      </div>
    </div>
  );
}