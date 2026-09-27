export async function withTimeout(promise, ms = 25000) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('This is taking longer than expected. Please retry.')), ms); })]); }
  finally { clearTimeout(timer); }
}
export async function fetchWithTimeout(url, options = {}, ms = 25000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, ms);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  catch (error) { if (error.name === 'AbortError') throw new Error('The connection timed out. Please retry.'); throw error; }
  finally { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); }
}
