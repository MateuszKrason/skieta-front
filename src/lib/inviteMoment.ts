type Listener = () => void

const listeners = new Set<Listener>()
let alreadyFired = false

/** Called by a page when the user is looking at something worth being pleased
 * about - a positive real return, a reinvestment path that multiplied. That's
 * when asking someone to recommend the app has a chance of landing, unlike a
 * timer that fires at whatever the user happened to be doing five minutes in.
 *
 * Fires at most once per page load; the nudge itself is once per browser. */
export function signalInviteMoment() {
  if (alreadyFired) return
  alreadyFired = true
  listeners.forEach((listener) => listener())
}

export function subscribeInviteMoment(listener: Listener) {
  // A moment can be signalled before the nudge mounts (the dashboard resolves
  // its query while the header is still rendering), so a late subscriber gets
  // told immediately rather than missing it.
  if (alreadyFired) {
    listener()
    return () => {}
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
