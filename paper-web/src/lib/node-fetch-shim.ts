// Browser shim for node-fetch
// Pyodide uses this at build time, but at runtime uses browser's native fetch
// This provides a minimal compatible interface

const fetchShim = globalThis.fetch as any;

export default fetchShim;
export { fetchShim as fetch };

