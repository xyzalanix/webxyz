/* ripple-backdrop.js v2 · miscgen_dsp on the homepage
   The centred image (#flesh_back_2) sends ripples through the full-screen copy behind it (#flesh_back).
   Two wave sources interfere:
     edges  a jump flood seeded from the outlines inside the centred image, so rings trace its people and forms
     frame  the centred image's rectangle (exact distance formula)
   Their waves add up with slightly different wavelengths, so they beat and form moiré where they cross.
   Plain WebGL1, no extensions: jump-flood coordinates are packed into ordinary 8-bit textures.
   Progressive: no WebGL, a GIF, or any failure leaves the original <img> as it was.

   Tune it from the HTML, all optional:
   <div class="back" data-strength="35" data-wave="60" data-reach="0.7" data-speed="1"
        data-source="both" data-edges="0.14" data-beat="0.83" data-mix="0.5">
     strength  max push in CSS pixels            wave    ring spacing in CSS pixels
     reach     how far rings travel (fraction of the screen's short side)
     speed     1 = normal                         source  "both", "edges" or "frame"
     edges     outline sensitivity, 0.05 (many lines) to 0.4 (only the strongest)
     beat      frame wavelength relative to the edge rings; values near 1 give slow, wide moiré
     mix       balance between the two sources, 0 = only edges, 1 = only frame */
(() => {
  const back = document.querySelector('.back');
  const img = document.getElementById('flesh_back');
  const centre = document.getElementById('flesh_back_2');
  if (!back || !img || !centre) return;

  const num = (v, d) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : d);
  const cfg = () => ({
    strength: num(back.dataset.strength, 35), wave: num(back.dataset.wave, 60), reach: num(back.dataset.reach, 0.7),
    speed: num(back.dataset.speed, 0.2), source: back.dataset.source || 'both', edges: num(back.dataset.edges, 0.14),
    beat: num(back.dataset.beat, 0.83), mix: num(back.dataset.mix, 0.5),
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
uniform sampler2D uImg; uniform vec2 uJ; uniform float uScale; uniform vec4 uBox; uniform vec2 uImgSize; uniform float uThresh;
float lum(vec2 uv){ return dot(texture2D(uImg,uv).rgb,vec3(0.299,0.587,0.114)); }
void main(){
  vec2 p=vec2(gl_FragCoord.x, uJ.y-gl_FragCoord.y)-0.5;
  vec2 px=(p+0.5)*uScale;                                    // screen (device) pixels
  vec2 q=(px-(uBox.xy-uBox.zw))/(uBox.zw*2.);                // 0..1 across the centred image's box
  if(q.x<0.||q.y<0.||q.x>1.||q.y>1.){ gl_FragColor=NONE; return; }
  // the centred image uses object-fit: cover inside its box
  float s=max(uBox.z*2./uImgSize.x, uBox.w*2./uImgSize.y); vec2 vis=(uBox.zw*2.)/(uImgSize*s);
  vec2 uv=(q-0.5)*vis+0.5;
  vec2 e=uScale*1.25/(uImgSize*s);                           // about one jump-flood cell, in image uv
  float gx=lum(uv+vec2(e.x,0.))-lum(uv-vec2(e.x,0.)), gy=lum(uv+vec2(0.,e.y))-lum(uv-vec2(0.,e.y));
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
  // 3. the backdrop: both ring systems added, then the image sampled through them
  const FS_FINAL = `precision highp float;${PACK}
uniform sampler2D uImg, uJfa; uniform vec2 uView, uImgSize, uJ; uniform float uScale;
uniform vec4 uBox; uniform float uTime, uStrength, uWave, uReach, uBeat, uMix; uniform int uSrc;
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
vec2 coverUV(vec2 px){ float s=max(uView.x/uImgSize.x, uView.y/uImgSize.y); vec2 sz=uImgSize*s; return (px-(uView-sz)*0.5)/sz; }
void main(){
  vec2 px=vec2(gl_FragCoord.x, uView.y-gl_FragCoord.y);
  vec2 off=vec2(0.);
  // edges: nearest outline from the jump flood
  if(uSrc!=2){
    vec2 jp=floor(px/uScale);
    vec2 s=unpack(texture2D(uJfa,(vec2(jp.x,uJ.y-1.-jp.y)+0.5)/uJ));
    if(s.x<65000.){
      vec2 d=(s+0.5)*uScale-px; float dist=length(d); vec2 dir=dist>0.001?d/dist:vec2(0.);
      float f=pow(clamp(1.-dist/uReach,0.,1.),2.);
      off+=dir*sin(dist/uWave*6.28318-uTime*4.)*f*(uSrc==0?1.-uMix:1.);
    }
  }
  // frame: the centred image's rectangle
  if(uSrc!=1){
    vec2 q=px-uBox.xy; float d=sdBox(q,uBox.zw);
    vec2 g=vec2(sdBox(q+vec2(1.,0.),uBox.zw)-sdBox(q-vec2(1.,0.),uBox.zw), sdBox(q+vec2(0.,1.),uBox.zw)-sdBox(q-vec2(0.,1.),uBox.zw));
    g=length(g)>0.?normalize(g):vec2(0.);
    float ad=abs(d), f=pow(clamp(1.-ad/uReach,0.,1.),2.);
    off+=(d>0.?-g:g)*sin(ad/(uWave*uBeat)*6.28318-uTime*4.)*f*(uSrc==0?uMix:1.);
  }
  vec2 uv=clamp(coverUV(px+off*uStrength),0.,1.);
  gl_FragColor=vec4(texture2D(uImg,uv).rgb,1.);
}`;

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const mk = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); p.u = {}; return p; };
  let P;
  try { P = { seed: mk(FS_SEED), jfa: mk(FS_JFA), fin: mk(FS_FINAL) }; }
  catch (e) { console.warn('ripple-backdrop: shaders failed, keeping the plain image', e); return; }
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
  let ready = false, imgW = 1, imgH = 1, field = null, fieldKey = '';
  const isGif = () => /\.gif(\?|#|$)/i.test(img.currentSrc || img.src);
  function upload() {
    if (!img.complete || !img.naturalWidth || isGif()) { ready = false; back.classList.remove('rippling'); return; }
    try {
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      imgW = img.naturalWidth; imgH = img.naturalHeight; ready = true; fieldKey = ''; back.classList.add('rippling');
    } catch (e) { ready = false; back.classList.remove('rippling'); }
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

  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, last = performance.now();
  function frame(now) {
    const c = cfg();
    t += Math.min(0.1, (now - last) / 1000) * c.speed; last = now;
    if (ready) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const r = centre.getBoundingClientRect();
      const box = [(r.left + r.width / 2) * dpr, (r.top + r.height / 2) * dpr, r.width / 2 * dpr, r.height / 2 * dpr];
      const src = c.source === 'edges' ? 1 : c.source === 'frame' ? 2 : 0;
      const key = [W, H, box.map(v => Math.round(v)).join(','), c.edges, imgW, imgH, img.currentSrc].join('|');
      if (src !== 2 && key !== fieldKey) { field = buildField(W, H, box, c); fieldKey = key; }
      gl.viewport(0, 0, W, H); gl.useProgram(P.fin);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, field ? field.tex : J[0].t);
      const f = P.fin;
      gl.uniform1i(U(f, 'uImg'), 0); gl.uniform1i(U(f, 'uJfa'), 1);
      gl.uniform2f(U(f, 'uView'), W, H); gl.uniform2f(U(f, 'uImgSize'), imgW, imgH);
      gl.uniform2f(U(f, 'uJ'), field ? field.w : 1, field ? field.h : 1); gl.uniform1f(U(f, 'uScale'), field ? field.scale : 1);
      gl.uniform4f(U(f, 'uBox'), box[0], box[1], box[2], box[3]);
      gl.uniform1f(U(f, 'uTime'), reduced ? 0.4 : t);
      gl.uniform1f(U(f, 'uStrength'), c.strength * dpr); gl.uniform1f(U(f, 'uWave'), Math.max(4, c.wave * dpr));
      gl.uniform1f(U(f, 'uReach'), Math.max(1, c.reach * Math.min(W, H)));
      gl.uniform1f(U(f, 'uBeat'), Math.max(0.2, c.beat)); gl.uniform1f(U(f, 'uMix'), Math.max(0, Math.min(1, c.mix)));
      gl.uniform1i(U(f, 'uSrc'), src);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();