/** Whether it is safe to ask a file input to jump straight to the camera.
 *
 * `capture="environment"` is only a hint, and Firefox on Android has never
 * implemented it properly (Mozilla bug 1553603): instead of handing the job
 * to the system camera app, Gecko opens its own capture surface, which on
 * many devices comes up as a black rectangle with no picture at all. The
 * photo can never be taken, and from the user's side the receipt scanner is
 * simply broken.
 *
 * Dropping the attribute there costs one extra tap - the normal file chooser
 * appears, with the camera as one of its options - and that chooser hands off
 * to the system camera app, which works. Everywhere else the attribute stays,
 * because going straight to the camera is the whole point on a phone.
 *
 * Firefox on iOS (FxiOS) is WebKit underneath and behaves like Safari, so it
 * is deliberately not covered by this. */
export function supportsDirectCameraCapture(userAgent: string): boolean {
  const isAndroid = /Android/i.test(userAgent)
  const isGecko = /Firefox\//i.test(userAgent) && !/FxiOS/i.test(userAgent)
  return !(isAndroid && isGecko)
}
