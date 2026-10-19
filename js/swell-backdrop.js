/* swell-backdrop.js · miscgen_dsp on the homepage, Swell mode
   The centred image (#flesh_back_2) makes the full-screen copy behind it (#flesh_back) swell.
   Like the tool's Swell mode: every pixel samples toward its nearest line, so the lines thicken and bulge out of the image.
   Two sources add up:
     edges  a jump flood seeded from the outlines inside the centred image, so its people and forms swell in the backdrop
     frame  the centred image's rectangle (exact distance formula), so the backdrop bulges out around it
   It breathes slowly: the swell grows and recedes, and the two sources can breathe out of step.
   Plain WebGL1, no extensions: jump-flood coordinates are packed into ordinary 8-bit textures.
   GIFs work too: the script decodes them itself (browsers only hand WebGL a GIF's current frame unreliably), plays them
   with their own frame timing, and recomputes the outlines on every frame, so the swell follows the animation.
   While a GIF plays, the centred copy is drawn from the same decoded frames (a canvas laid exactly over the hidden
   #flesh_back_2), so the backdrop and the centred image can never drift apart, which matters for strobing GIFs.
   Progressive: no WebGL or any failure leaves the original <img> as it was.
   Uses the same CSS hooks as ripple-backdrop.js (.ripple-canvas, .back.rippling), so it is a drop-in swap.

   Tune it from the HTML, all optional:
   <div class="back" data-strength="90" data-reach="0.45" data-soft="2" data-breathe="7" data-depth="0.6"
        data-lag="0.5" data-source="both" data-edges="0.2" data-mix="0.5" data-push="1">
     strength  max pull in CSS pixels                 reach    how far the swell spreads (fraction of the screen's short side)
     soft      falloff shape, 1 = linear, higher = tighter around the lines
     breathe   seconds per breath, 0 = still          depth    how far it recedes between breaths, 0 = steady, 1 = all the way
     lag       how far the frame breathes behind the edges, in breaths (0 = together, 0.5 = opposite)
     source    "both", "edges" or "frame"             edges    outline sensitivity, 0.05 (many lines) to 0.4 (only the strongest)
     mix       balance between the two sources, 0 = only edges, 1 = only frame
     push      1 = lines swell outward, -1 = they pinch inward */
(() => {
  const back = document.querySelector('.back');
  const img = document.getElementById('flesh_back');
  const centre = document.getElementById('flesh_back_2');
  if (!back || !img || !centre) return;

  const num = (v, d) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : d);
  const cfg = () => ({
    strength: num(back.dataset.strength, 90), reach: num(back.dataset.reach, 0.45), soft: num(back.dataset.soft, 2),
    breathe: num(back.dataset.breathe, 7), depth: num(back.dataset.depth, 0.6), lag: num(back.dataset.lag, 0.5),
    source: back.dataset.source || 'both', edges: num(back.dataset.edges, 0.2), mix: num(back.dataset.mix, 0.5),
    push: num(back.dataset.push, 1),
  });

  const cv = document.createElement('canvas');
  cv.className = 'ripple-canvas';
  cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return;

  const VS = `attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;
  // coordinates are packed as two 16-bit numbers in RGBA8; x = 65535 marks "no seed yet"
  const PACK = `
vec4 pack(vec2 p){ return vec4(floor(p.x/256.),mod(p.x,256.),floor(p.y/256.),mod(p.y,256.))/255.; }
vec2 unpack(vec4 c){ c=floor(c*255.+0.5); return vec2(c.r*256.+c.g, c.b*256.+c.a); }
const vec4 NONE=vec4(1.);`;
  // 1. seeds: outlines of the centred image, in jump-flood space (y down, like the page)
  const FS_SEED = `precision highp float;${PACK}
uniform sampler2D uImg; uniform vec2 uJ, uE; uniform float uScale; uniform vec4 uBox; uniform vec2 uImgSize; uniform float uThresh;
float lum0(vec2 uv){ return dot(texture2D(uImg,uv).rgb,vec3(0.299,0.587,0.114)); }
float lum(vec2 uv){ return 0.25*(lum0(uv+uE*vec2(-.5,-.5))+lum0(uv+uE*vec2(.5,-.5))+lum0(uv+uE*vec2(-.5,.5))+lum0(uv+uE*vec2(.5,.5))); }   // softened, so only the main forms count
void main(){
  vec2 p=vec2(gl_FragCoord.x, uJ.y-gl_FragCoord.y)-0.5;
  vec2 px=(p+0.5)*uScale;                                    // screen (device) pixels
  vec2 q=(px-(uBox.xy-uBox.zw))/(uBox.zw*2.);                // 0..1 across the centred image's box
  if(q.x<0.||q.y<0.||q.x>1.||q.y>1.){ gl_FragColor=NONE; return; }
  // the centred image uses object-fit: cover inside its box
  float s=max(uBox.z*2./uImgSize.x, uBox.w*2./uImgSize.y); vec2 vis=(uBox.zw*2.)/(uImgSize*s);
  vec2 uv=(q-0.5)*vis+0.5;
  float gx=lum(uv+vec2(uE.x,0.))-lum(uv-vec2(uE.x,0.)), gy=lum(uv+vec2(0.,uE.y))-lum(uv-vec2(0.,uE.y));
  gl_FragColor = length(vec2(gx,gy))>uThresh ? pack(p) : NONE;
}`;
  // 2. jump flood
  const FS_JFA = `precision highp float;${PACK}
uniform sampler2D uPrev; uniform vec2 uJ; uniform float uStep;
void main(){
  vec2 p=vec2(gl_FragCoord.x, uJ.y-gl_FragCoord.y)-0.5;
  vec2 best=vec2(65535.); float bd=1e20;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 q=p+vec2(float(i),float(j))*uStep;
    if(q.x<0.||q.y<0.||q.x>=uJ.x||q.y>=uJ.y) continue;
    vec2 s=unpack(texture2D(uPrev,(vec2(q.x,uJ.y-1.-q.y)+0.5)/uJ));
    if(s.x>65000.) continue;
    vec2 d=s-p; float dd=dot(d,d); if(dd<bd){ bd=dd; best=s; }
  }
  gl_FragColor = best.x>65000. ? NONE : pack(best);
}`;
  // 3. the backdrop: each pixel samples toward its nearest line, more strongly the closer it is
  const FS_FINAL = `precision highp float;${PACK}
uniform sampler2D uImg, uJfa; uniform vec2 uView, uImgSize, uJ; uniform float uScale;
uniform vec4 uBox; uniform float uStrength, uSoft; uniform vec2 uAmt, uReach; uniform int uSrc;
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
vec2 coverUV(vec2 px){ float s=max(uView.x/uImgSize.x, uView.y/uImgSize.y); vec2 sz=uImgSize*s; return (px-(uView-sz)*0.5)/sz; }
void main(){
  vec2 px=vec2(gl_FragCoord.x, uView.y-gl_FragCoord.y);
  vec2 off=vec2(0.);
  // edges: toward the nearest outline from the jump flood
  if(uSrc!=2){
    vec2 jp=floor(px/uScale);
    vec2 s=unpack(texture2D(uJfa,(vec2(jp.x,uJ.y-1.-jp.y)+0.5)/uJ));
    if(s.x<65000.){
      vec2 d=(s+0.5)*uScale-px; float dist=length(d); vec2 dir=dist>0.001?d/dist:vec2(0.);
      off+=dir*pow(clamp(1.-dist/uReach.x,0.,1.),uSoft)*uAmt.x;
    }
  }
  // frame: toward the centred image's rectangle
  if(uSrc!=1){
    vec2 q=px-uBox.xy; float d=sdBox(q,uBox.zw);
    vec2 g=vec2(sdBox(q+vec2(1.,0.),uBox.zw)-sdBox(q-vec2(1.,0.),uBox.zw), sdBox(q+vec2(0.,1.),uBox.zw)-sdBox(q-vec2(0.,1.),uBox.zw));
    g=length(g)>0.?normalize(g):vec2(0.);
    off+=(d>0.?-g:g)*pow(clamp(1.-abs(d)/uReach.y,0.,1.),uSoft)*uAmt.y;
  }
  vec2 uv=clamp(coverUV(px+off*uStrength),0.,1.);
  gl_FragColor=vec4(texture2D(uImg,uv).rgb,1.);
}`;

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const mk = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); p.u = {}; return p; };
  let P;
  try { P = { seed: mk(FS_SEED), jfa: mk(FS_JFA), fin: mk(FS_FINAL) }; }
  catch (e) { console.warn('swell-backdrop: shaders failed, keeping the plain image', e); return; }
  const U = (p, n) => (n in p.u ? p.u[n] : (p.u[n] = gl.getUniformLocation(p, n)));

  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const mkTex = filter => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    [[gl.TEXTURE_MIN_FILTER, filter], [gl.TEXTURE_MAG_FILTER, filter], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]
      .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); return t; };
  const imgTex = mkTex(gl.LINEAR);
  const J = [0, 1].map(() => { const t = mkTex(gl.NEAREST), f = gl.createFramebuffer(); return { t, f }; });
  let jW = 0, jH = 0;
  function sizeJ(w, h) {
    if (w === jW && h === jH) return; jW = w; jH = h;
    for (const j of J) { gl.bindTexture(gl.TEXTURE_2D, j.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, j.f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, j.t, 0); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  back.appendChild(cv);
  let ready = false, imgW = 1, imgH = 1, field = null, fieldKey = '', drawnKey = '';
  const isGif = () => /\.gif(\?|#|$)/i.test(img.currentSrc || img.src);
  let gif = null, gifToken = 0;
  // the centred copy, drawn by us while a GIF plays
  const twin = document.createElement('canvas');
  twin.setAttribute('aria-hidden', 'true');
  twin.style.cssText = 'position:absolute;display:none;pointer-events:none;margin:0';
  centre.parentNode.insertBefore(twin, centre.nextSibling);
  const tctx = twin.getContext('2d');
  function placeTwin() {                                      // match the hidden centred image's box exactly, sub-pixel included
    const a = centre.getBoundingClientRect(), r = twin.getBoundingClientRect();
    const dx = a.left - r.left, dy = a.top - r.top;
    if (Math.abs(dx) > 0.01) twin.style.left = (parseFloat(twin.style.left) || 0) + dx + 'px';
    if (Math.abs(dy) > 0.01) twin.style.top = (parseFloat(twin.style.top) || 0) + dy + 'px';
    if (Math.abs(a.width - r.width) > 0.01) twin.style.width = a.width + 'px';
    if (Math.abs(a.height - r.height) > 0.01) twin.style.height = a.height + 'px';
  }
  function showTwin(on) { twin.style.display = on ? 'block' : 'none'; centre.style.visibility = on ? 'hidden' : ''; }
  const off = () => { ready = false; back.classList.remove('rippling'); showTwin(false); };
  function upload() {
    gif = null; const token = ++gifToken;
    showTwin(false);
    if (!img.complete || !img.naturalWidth) { off(); return; }
    if (isGif()) {
      // decode it ourselves; keep showing the plain image until the first frame is ready
      off();
      fetch(img.currentSrc || img.src).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(buf => {
          if (token !== gifToken) return;
          const g = parseGif(buf); if (!g.frames.length) throw new Error('empty gif');
          g.buf = new Uint8Array(g.W * g.H * 4); g.k = -1; g.prev = -1; g.saved = null; g.next = 0;
          g.frame = tctx && new ImageData(new Uint8ClampedArray(g.buf.buffer), g.W, g.H);
          gif = g; imgW = g.W; imgH = g.H;
        }).catch(e => { if (token === gifToken) { console.warn('swell-backdrop: could not play this GIF, keeping the plain image', e); off(); } });
      return;
    }
    try {
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      imgW = img.naturalWidth; imgH = img.naturalHeight; ready = true; fieldKey = ''; drawnKey = ''; back.classList.add('rippling');
    } catch (e) { off(); }
  }

  /* ---------- a small GIF player: parse once, decode one frame at a time (all frames at once would be hundreds of MB) ---------- */
  function parseGif(ab) {
    const b = new Uint8Array(ab); let p = 13;
    if (!/^GIF8[79]a$/.test(String.fromCharCode(...b.subarray(0, 6)))) throw new Error('not a gif');
    const W = b[6] | b[7] << 8, H = b[8] | b[9] << 8, pk = b[10];
    const table = f => { const n = 3 * (1 << ((f & 7) + 1)); const t = b.subarray(p, p + n); p += n; return t; };
    const gct = pk & 0x80 ? table(pk) : null;
    const subBlocks = () => { const parts = []; let len = 0;
      while (p < b.length && b[p]) { const n = b[p]; parts.push(b.subarray(p + 1, p + 1 + n)); len += n; p += n + 1; }
      p++; const out = new Uint8Array(len); let o = 0; for (const q of parts) { out.set(q, o); o += q.length; } return out; };
    const frames = []; let gce = { disposal: 0, delay: 0, trans: -1 };
    while (p < b.length) {
      const c = b[p++];
      if (c === 0x3B) break;
      if (c === 0x21) {
        const label = b[p++];
        if (label === 0xF9) { const d = subBlocks(); gce = { disposal: (d[0] >> 2) & 7, delay: d[1] | d[2] << 8, trans: d[0] & 1 ? d[3] : -1 }; }
        else subBlocks();
      } else if (c === 0x2C) {
        const x = b[p] | b[p + 1] << 8, y = b[p + 2] | b[p + 3] << 8, w = b[p + 4] | b[p + 5] << 8, h = b[p + 6] | b[p + 7] << 8, f = b[p + 8]; p += 9;
        const pal = f & 0x80 ? table(f) : gct;
        const min = b[p++], data = subBlocks();
        // browsers treat delays of 0 or 1 centisecond as 10
        frames.push({ x, y, w, h, interlace: !!(f & 0x40), pal, min, data, disposal: gce.disposal, trans: gce.trans, delay: (gce.delay < 2 ? 10 : gce.delay) * 10 });
        gce = { disposal: 0, delay: 0, trans: -1 };
      } else break;
    }
    return { W, H, frames };
  }
  function lzw(min, data, n) {
    const out = new Uint8Array(n), clear = 1 << min, eoi = clear + 1;
    const pre = new Int16Array(4096), suf = new Uint8Array(4096), stack = new Uint8Array(4097);
    for (let i = 0; i < clear; i++) { pre[i] = -1; suf[i] = i; }
    let size = min + 1, mask = (1 << size) - 1, avail = clear + 2, old = -1, first = 0, bits = 0, datum = 0, o = 0;
    for (let i = 0; i < data.length && o < n;) {
      datum |= data[i++] << bits; bits += 8;
      while (bits >= size && o < n) {
        let code = datum & mask; datum >>>= size; bits -= size;
        if (code === clear) { size = min + 1; mask = (1 << size) - 1; avail = clear + 2; old = -1; continue; }
        if (code === eoi) { i = data.length; break; }
        if (old === -1) { if (code >= clear) { i = data.length; break; } out[o++] = suf[code]; old = first = code; continue; }
        const inCode = code; let sp = 0;
        if (code >= avail) { if (code > avail) { i = data.length; break; } stack[sp++] = first; code = old; }
        while (code >= clear) { stack[sp++] = suf[code]; code = pre[code]; }
        first = suf[code]; stack[sp++] = first;
        if (avail < 4096) { pre[avail] = old; suf[avail] = first; avail++; if ((avail & mask) === 0 && avail < 4096) { size++; mask += avail; } }
        old = inCode;
        while (sp > 0 && o < n) out[o++] = stack[--sp];
      }
    }
    return out;
  }
  function gifStep(g) {
    const k = (g.k + 1) % g.frames.length, f = g.frames[k], W = g.W, H = g.H, buf = g.buf;
    if (k === 0) { buf.fill(0); g.saved = null; }
    else if (g.prev >= 0) {                                     // undo the previous frame as it asked
      const q = g.frames[g.prev];
      if (q.disposal === 2) for (let y = Math.max(0, q.y); y < Math.min(H, q.y + q.h); y++) buf.fill(0, (y * W + Math.max(0, q.x)) * 4, (y * W + Math.min(W, q.x + q.w)) * 4);
      else if (q.disposal === 3 && g.saved) buf.set(g.saved);
    }
    g.saved = f.disposal === 3 ? buf.slice() : null;
    const idx = lzw(f.min, f.data, f.w * f.h), pal = f.pal;
    const rows = new Array(f.h);
    if (f.interlace) { let r = 0; for (const [s, st] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let y = s; y < f.h; y += st) rows[r++] = y; }
    else for (let y = 0; y < f.h; y++) rows[y] = y;
    if (pal) for (let r = 0; r < f.h; r++) {
      const ty = f.y + rows[r]; if (ty < 0 || ty >= H) continue;
      for (let c = 0; c < f.w; c++) {
        const ci = idx[r * f.w + c]; if (ci === f.trans) continue;
        const tx = f.x + c; if (tx < 0 || tx >= W) continue;
        const o = (ty * W + tx) * 4, pi = ci * 3; buf[o] = pal[pi]; buf[o + 1] = pal[pi + 1]; buf[o + 2] = pal[pi + 2]; buf[o + 3] = 255;
      }
    }
    g.prev = k; g.k = k;
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  }
  img.addEventListener('load', upload);
  upload();

  // the outline field: recomputed when the image, the centred box or the sensitivity changes
  function buildField(W, H, box, c) {
    const scale = Math.max(2, Math.ceil(Math.max(W, H) / 900));     // jump flood at ~900 px on the long side
    const w = Math.ceil(W / scale), h = Math.ceil(H / scale);
    sizeJ(w, h);
    gl.viewport(0, 0, w, h);
    gl.useProgram(P.seed); gl.bindFramebuffer(gl.FRAMEBUFFER, J[0].f);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.uniform1i(U(P.seed, 'uImg'), 0); gl.uniform2f(U(P.seed, 'uJ'), w, h); gl.uniform1f(U(P.seed, 'uScale'), scale);
    gl.uniform4f(U(P.seed, 'uBox'), box[0], box[1], box[2], box[3]); gl.uniform2f(U(P.seed, 'uImgSize'), imgW, imgH);
    gl.uniform1f(U(P.seed, 'uThresh'), c.edges);
    const cs = Math.max(box[2] * 2 / imgW, box[3] * 2 / imgH); gl.uniform2f(U(P.seed, 'uE'), scale * 2.5 / (imgW * cs), scale * 2.5 / (imgH * cs));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(P.jfa); gl.uniform2f(U(P.jfa, 'uJ'), w, h); gl.uniform1i(U(P.jfa, 'uPrev'), 0);
    let src = 0;
    for (let st = 2 ** Math.ceil(Math.log2(Math.max(w, h))) / 2; st >= 1; st /= 2) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, J[1 - src].f); gl.bindTexture(gl.TEXTURE_2D, J[src].t);
      gl.uniform1f(U(P.jfa, 'uStep'), st); gl.drawArrays(gl.TRIANGLES, 0, 3); src = 1 - src;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: J[src].t, w, h, scale };
  }

  // one breath: 0 at the low point, 1 at the peak, eased
  const breath = (t, period, phase) => 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / period - phase));
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, last = performance.now();
  function frame(now) {
    const c = cfg();
    t += Math.min(0.1, (now - last) / 1000); last = now;
    if (gif && now >= gif.next) {                               // next GIF frame: new picture, new outlines
      gifStep(gif);
      // only take over the centred image when it shows the same GIF (it always does on the homepage)
      if (tctx && centre.src === img.src) {
        if (twin.width !== gif.W || twin.height !== gif.H) { twin.width = gif.W; twin.height = gif.H; }
        tctx.putImageData(gif.frame, 0, 0); showTwin(true); placeTwin();
      }
      gif.next = now - gif.next > 500 ? now + gif.frames[gif.k].delay : gif.next + gif.frames[gif.k].delay;
      if (!ready) { ready = true; back.classList.add('rippling'); }
      fieldKey = ''; drawnKey = '';
    }
    if (ready) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; drawnKey = ''; }
      if (gif && twin.style.display === 'block') placeTwin();
      const r = centre.getBoundingClientRect();
      const box = [(r.left + r.width / 2) * dpr, (r.top + r.height / 2) * dpr, r.width / 2 * dpr, r.height / 2 * dpr];
      const src = c.source === 'edges' ? 1 : c.source === 'frame' ? 2 : 0;
      const key = [W, H, box.map(v => Math.round(v)).join(','), c.edges, imgW, imgH, img.currentSrc].join('|');
      if (src !== 2 && key !== fieldKey) { field = buildField(W, H, box, c); fieldKey = key; drawnKey = ''; }

      // the breath scales both how hard and how far it swells; still (breathe 0 or reduced motion) sits near the peak
      const still = reduced || c.breathe <= 0, depth = Math.max(0, Math.min(1, c.depth));
      const bE = still ? 0.85 : breath(t, c.breathe, 0), bF = still ? 0.85 : breath(t, c.breathe, c.lag);
      const lvl = b => 1 - depth + depth * b;
      const mix = Math.max(0, Math.min(1, c.mix)), both = src === 0;
      const amtE = lvl(bE) * (both ? 1 - mix : 1) * c.push, amtF = lvl(bF) * (both ? mix : 1) * c.push;
      const R = Math.max(1, c.reach * Math.min(W, H));
      const reachE = R * (0.6 + 0.4 * lvl(bE)), reachF = R * (0.6 + 0.4 * lvl(bF));

      // nothing moves when still: draw once per change, then let the canvas keep its picture
      const drawKey = still ? [key, src, c.strength, c.reach, c.soft, mix, c.push, depth].join('|') : '';
      if (!still || drawKey !== drawnKey) {
        gl.viewport(0, 0, W, H); gl.useProgram(P.fin);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, field ? field.tex : J[0].t);
        const f = P.fin;
        gl.uniform1i(U(f, 'uImg'), 0); gl.uniform1i(U(f, 'uJfa'), 1);
        gl.uniform2f(U(f, 'uView'), W, H); gl.uniform2f(U(f, 'uImgSize'), imgW, imgH);
        gl.uniform2f(U(f, 'uJ'), field ? field.w : 1, field ? field.h : 1); gl.uniform1f(U(f, 'uScale'), field ? field.scale : 1);
        gl.uniform4f(U(f, 'uBox'), box[0], box[1], box[2], box[3]);
        gl.uniform1f(U(f, 'uStrength'), c.strength * dpr); gl.uniform1f(U(f, 'uSoft'), Math.max(0.2, c.soft));
        gl.uniform2f(U(f, 'uAmt'), amtE, amtF); gl.uniform2f(U(f, 'uReach'), reachE, reachF);
        gl.uniform1i(U(f, 'uSrc'), src);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.activeTexture(gl.TEXTURE0);
        drawnKey = drawKey;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();