import { useEffect } from 'react'
import { queryClient } from './queryClient'

/** Revalidate after the public route's hydration boundary has committed. */
export function usePublicSnapshotRevalidation() {
  useEffect(() => {
    const state = window as Window & { kurioPrerenderProfile?: string }
    if (!state.kurioPrerenderProfile) return
    delete state.kurioPrerenderProfile
    for (const resource of ['session', 'catalog', 'nfts']) {
      void queryClient.invalidateQueries({ queryKey: [resource] })
    }
  }, [])
}
