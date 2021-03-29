function dcg_encode(t) {
  return "DCG";
}
function dcg_decode(t) {
  if (0 == t.startsWith("DCG"))
    return console.log("Decode failed, bad format"), "";
  const o = t.substr(3).replace(/\-/g, "/").replace(/\_/g, "="),
    n = atob(o);
  n.length;
  console.log(atob(o));
  var r = 0;
  const a = (t = 1) => {
      r += t;
    },
    e = () => n[r];
  var s = e();
  const c = (240 & s) >> 4,
    l = 15 & s;
  console.log(r, "version", c, "eggCount", l, s.toString(2).padStart(8, "0")),
    a();
  const g = (s = e());
  console.log(r, "checksum", g, s.toString(2).padStart(8, "0")), a();
  const i = (s = e());
  console.log(r, "nameLength", i, s.toString(2).padStart(8, "0"));
  var d = 0;
  const f = () => {
    a();
    const t = ((t) => n.slice(r, r + t).toString("latin1"))(4).trim();
    console.log(r, "set", t), a(4);
    var o = e();
    const s = 1 + ((192 & o) >> 6),
      c = 63 & o;
    console.log(r, "padding", s, "count", c, o.toString(2).padStart(8, "0"));
    const l = (t, n) => {
      a();
      const r = ((127 & (o = e())) << n) & t;
      return 128 & o ? l(r, n + 7) : r;
    };
    for (var g = 0, i = 0; i < c; i++) {
      a();
      const n = 1 + ((192 & (o = e())) >> 6),
        c = (56 & o) >> 3;
      var f = 3 & o;
      4 & o && (f = l(f, 2)),
        (g += f),
        (d += n),
        console.log(
          r,
          "cc",
          n,
          "pa",
          c,
          "offset",
          f,
          `${t}-${g.toString().padStart(s, "0")}`,
          o.toString(2).padStart(8, "0")
        );
    }
  };
  for (var S = 0; S < l; S++) f();
  for (d = 0; d < 49; ) f(), console.log(d);
  for (S = 0; S < 20; S++) console.log(S, n[S].toString(2).padStart(8, "0"));
}
String.prototype.startsWith ||
  (String.prototype.startsWith = function (t, o) {
    return (o = o || 0), this.substr(o, t.length) === t;
  }),
  (null != global.btoa && null != globalThis.atob) ||
    ((global.btoa = (t) => Buffer.from(t, "latin1").toString("base64")),
    (global.atob = (t) => Buffer.from(t, "base64"))),
  dcg_decode(
    "DCGARkiU1Q1IEHBU1Q1IE-CwcHBwcFBwcFBQUHBwUFTdGFydGVyIERlY2ssIE1hY2hpbmUgQmxhY2sgW1NULTVd"
  );
