// Identifier renaming applied to min.js. The best map is found by search.js (deflate size depends on the letters).
// JS idents live outside the shader template; GLSL idents inside the fragment shader template.
const JS = ['a', 'b', 'd', 'p', 'F', 'P', 'S', 'i'], GL = ['u', 'O', 'm', 'T', 'd', 'g', 'G', 's', 'p', 'r', 'L', 'i'];
function apply(js, map) {
  if (!map) return js;
  const k = js.indexOf('`#version 300 es\nprecision'), e = js.indexOf('`),compile');
  const sub = (t, from, to) => t.replace(/\b[A-Za-z_]\w*\b/g, w => from.includes(w) ? to[from.indexOf(w)] : w);
  // JS: skip property names after '.', the arrow param e, and the template bodies
  const subJS = t => t.replace(/(\.)?\b([A-Za-z_]\w*)\b/g, (all, dot, w) => !dot && JS.includes(w) ? map.js[JS.indexOf(w)] : all);
  const head = js.slice(0, k), fs = js.slice(k, e), tail = js.slice(e);
  const v = head.indexOf('`#version'), ve = head.indexOf('`:', v);
  return subJS(head.slice(0, v)) + head.slice(v, ve) + subJS(head.slice(ve)) + sub(fs, GL, map.gl)
    + subJS(tail).replace("'u'", "'" + map.gl[GL.indexOf('u')] + "'");
}
module.exports = { JS, GL, apply };
