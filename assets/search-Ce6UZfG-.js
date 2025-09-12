function o(n,r){const s=n.toLowerCase(),e=r.toLowerCase();return e?s===e?100:s.startsWith(e)?80:s.includes(e)?50:0:0}function c(n,r,s=8){return r.trim()?n.map(t=>({i:t,s:Math.max(o(t.title,r),o(t.slug,r))})).filter(t=>t.s>0).sort((t,i)=>i.s-t.s).slice(0,s).map(t=>t.i):[]}export{c as searchItems};
//# sourceMappingURL=search-Ce6UZfG-.js.map
