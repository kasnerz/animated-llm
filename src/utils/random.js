// Simple deterministic PRNG and helpers for seeded vectors

// String hash to 32-bit integer (djb2 variant)
export function hashStringToInt(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  // Force to 32-bit unsigned
  return h >>> 0;
}

// Mulberry32 PRNG: https://stackoverflow.com/a/47593316
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededVector(key, length = 8) {
  const rng = mulberry32(hashStringToInt(key));
  const vals = Array.from({ length }, () => {
    const v = Math.round((rng() * 2 - 1 + Number.EPSILON) * 10) / 10; // [-1,1], 1 decimal
    return Object.is(v, -0) ? 0 : v;
  });
  return vals;
}

export function randomVector(length = 8) {
  const vals = Array.from({ length }, () => {
    const v = Math.round((Math.random() * 2 - 1 + Number.EPSILON) * 10) / 10;
    return Object.is(v, -0) ? 0 : v;
  });
  return vals;
}
