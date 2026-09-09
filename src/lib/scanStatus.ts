import { useSyncExternalStore } from 'react'

// Whether a receipt scan is in flight right now, shared across every
// ScanReceiptButton instance - the header's, the dashboard's and Wydatki's
// own button can all be mounted at the same time, and whichever one actually
// started the scan, the same loading indicator should show (see
// ScanningIndicator). A plain module-level store with useSyncExternalStore
// gets that without a context provider anywhere in the tree, matching how
// api/client.ts's tokenStore is a plain object rather than a context too -
// the difference here is only that this one needs to be read reactively.
type Listener = () => void

let scanning = false
const listeners = new Set<Listener>()

export function setScanInFlight(next: boolean) {
  if (scanning === next) return
  scanning = next
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return scanning
}

export function useIsScanInFlight() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
