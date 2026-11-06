// `runonweb` ships raw TypeScript that references browser globals our `lib` setting doesn't declare
// (WebGPU's `GPU`, `WorkerGlobalScope`). Declare them loosely so the type-check passes; we never use them directly.
declare interface GPU {
  requestAdapter(options?: unknown): Promise<{ features?: { has(name: string): boolean } } | null>;
}
declare class WorkerGlobalScope {}
