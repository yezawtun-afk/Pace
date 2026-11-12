const hex = (h) => h.replace('#', '').match(/../g).map((v) => parseInt(v, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
for (const soft of ['#FEF5F1', '#FEF6F3', '#FFF7F4', '#FDF0EB']) {
  console.log(`${soft}  accent=${ratio('#C4472E', soft).toFixed(2)}  border#F0C4B8`);
}
console.log('accentSoft vs paper', ratio('#FEF6F3', '#FBF8F4').toFixed(2));
console.log('accentBorder vs paper', ratio('#F0C4B8', '#FBF8F4').toFixed(2));
console.log('accent vs surface white', ratio('#C4472E', '#FFFFFF').toFixed(2));
console.log('danger #B8443A on paper', ratio('#B8443A', '#FBF8F4').toFixed(2));
console.log('danger #B8443A on dangerSoft', ratio('#B8443A', '#FDECEA').toFixed(2));
