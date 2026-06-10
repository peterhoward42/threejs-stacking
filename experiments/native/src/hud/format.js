export function fmt(n) {
  return n.toFixed(2);
}

export function fmtVec(v) {
  return `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`;
}

export function fmtQuat(q) {
  return `(${fmt(q.x)}, ${fmt(q.y)}, ${fmt(q.z)}, ${fmt(q.w)})`;
}
