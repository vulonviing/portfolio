// The 14-step journey of `c = a + b`. Labels are translated in
// translations.js under trace.steps[id] (same ids, same order); layer links
// which of the 12 stack layers a step belongs to, for cross-highlighting.
// phase marks which side of the host/device line (see index.css --host /
// --device) a step runs on — 'host' (CPU, still preparing the call),
// 'device' (GPU, the call is now executing), or 'return' (the single step
// where the result hands back to the host).

export const trace = [
  { id: 'python', layer: null, phase: 'host' },
  { id: 'tensor-api', layer: 'tensor', phase: 'host' },
  { id: 'operator', layer: 'operator', phase: 'host' },
  { id: 'dispatcher', layer: 'dispatcher', phase: 'host' },
  { id: 'cuda-backend', layer: 'backend', phase: 'host' },
  { id: 'allocator', layer: 'allocator', phase: 'host' },
  { id: 'kernel-select', layer: 'backend', phase: 'host' },
  { id: 'kernel-launch', layer: 'kernel', phase: 'device' },
  { id: 'cuda-runtime', layer: 'runtime', phase: 'device' },
  { id: 'cuda-driver', layer: 'runtime', phase: 'device' },
  { id: 'gpu-scheduler', layer: 'kernel', phase: 'device' },
  { id: 'warps', layer: 'kernel', phase: 'device' },
  { id: 'gpu-memory', layer: 'kernel', phase: 'device' },
  { id: 'return', layer: 'tensor', phase: 'return' },
];
