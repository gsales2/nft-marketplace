let readiness: Promise<unknown> = Promise.resolve()
let realtimeReadiness: Promise<void> | undefined

// Readiness only gates transport; responses and business rules remain in MSW.
export function setNetworkReady(promise: Promise<unknown>) {
  readiness = promise
}

export function waitForNetwork() {
  return readiness
}

export function waitForRealtimeNetwork() {
  return (realtimeReadiness ??= waitForNetwork().then(async () => {
    if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
      const [{ worker }, { realtimeHandlers }] = await Promise.all([
        import('../mocks/browser'),
        import('../mocks/realtime'),
      ])
      worker.use(...realtimeHandlers)
    }
  }))
}
