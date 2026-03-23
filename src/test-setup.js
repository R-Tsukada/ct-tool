import "@testing-library/jest-dom";

// jsdomのlocalStorageが環境によって動作しないケースへの対処
const store = {};
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

// ResizeObserver mock (jsdom does not implement it)
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
