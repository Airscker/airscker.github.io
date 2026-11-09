(function () {
    "use strict";

    var root = document.documentElement;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("js");

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---- Scroll: deepen the sky, solidify the nav ---- */
    var nav = document.getElementById("nav");
    var ticking = false;

    function onScroll() {
        var h = window.innerHeight || 1;
        var s = Math.min(window.scrollY / (h * 0.9), 1);
        root.style.setProperty("--s", s.toFixed(3));
        nav.classList.toggle("is-solid", window.scrollY > h * 0.55);
        ticking = false;
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    /* ---- Pointer parallax on the galaxy (fine pointers only) ---- */
    if (!reduce && window.matchMedia("(pointer: fine)").matches) {
        var drift = document.querySelector(".sky-drift");
        window.addEventListener("pointermove", function (e) {
            var x = (e.clientX / window.innerWidth - 0.5) * -18;
            var y = (e.clientY / window.innerHeight - 0.5) * -12;
            drift.style.setProperty("--mx", x.toFixed(1) + "px");
            drift.style.setProperty("--my", y.toFixed(1) + "px");
        }, { passive: true });
    }

    /* ---- Reveal on scroll, staggered within each section ---- */
    var items = document.querySelectorAll(".reveal");
    document.querySelectorAll(".block").forEach(function (block) {
        block.querySelectorAll(".reveal").forEach(function (el, i) {
            el.style.setProperty("--rd", Math.min(i, 6) * 0.07 + "s");
        });
    });

    if (reduce || !("IntersectionObserver" in window)) {
        items.forEach(function (el) { el.classList.add("is-in"); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-in");
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
        items.forEach(function (el) { io.observe(el); });
    }

    /* ---- Active section in nav ---- */
    var links = {};
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
        links[a.getAttribute("href").slice(1)] = a;
    });

    if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var a = links[entry.target.id];
                if (a) a.classList.toggle("is-active", entry.isIntersecting);
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        Object.keys(links).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) spy.observe(el);
        });
    }
})();

/* ---- Galaxy backdrop: rendered nebula + galaxy, plus twinkling stars ---- */
(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia("(pointer: fine)").matches;

    /* ---------- 1. Nebula, galaxy and dense star field (WebGL, rendered once) ---------- */

    var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

    var FRAG = [
        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif",
        "uniform vec2 uRes;",
        "uniform float uSeed;",
        "uniform float uPx;",

        "float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}",
        "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
        "  return mix(mix(hash12(i),hash12(i+vec2(1.,0.)),u.x),mix(hash12(i+vec2(0.,1.)),hash12(i+vec2(1.,1.)),u.x),u.y);}",
        "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);",
        "  for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}",

        // one layer of point stars: one candidate per grid cell
        "vec3 starLayer(vec2 p,float scale,float thresh,float amp){",
        "  vec2 g=p*scale;vec2 id=floor(g);vec2 f=fract(g)-.5;",
        "  float h=hash12(id+uSeed);",
        "  if(h<thresh)return vec3(0.);",
        "  float k=(h-thresh)/(1.-thresh);",
        "  vec2 off=vec2(hash12(id+17.1),hash12(id+31.7))-.5;",
        "  float cellPx=uRes.y/scale;",
        "  float rad=(.42+1.2*k*k*k)*uPx;",
        "  float dpx=length(f-off*.6)*cellPx;",
        "  float b=exp(-dpx*dpx/(rad*rad));",
        "  float t=hash12(id+5.3);",
        "  vec3 c=t<.22?vec3(.72,.82,1.):(t>.86?vec3(1.,.84,.68):vec3(1.,.97,.94));",
        "  return c*b*amp*(.35+.65*k);}",

        "void main(){",
        "  vec2 uv=gl_FragCoord.xy/uRes;",
        "  float asp=uRes.x/uRes.y;",
        "  vec2 p=vec2(uv.x*asp,uv.y);",
        "  bool tall=asp<1.;",

        // deep-space base
        "  vec3 col=mix(vec3(.006,.009,.022),vec3(.018,.026,.058),clamp(uv.y*.65+uv.x*.35,0.,1.));",

        // nebula band: upper-left down to lower-right, like the original photo
        "  vec2 A=tall?vec2(-.1*asp,.95):vec2(.08*asp,1.1);",
        "  vec2 B=tall?vec2(1.2*asp,.35):vec2(1.05*asp,.1);",
        "  vec2 AB=normalize(B-A);vec2 N=vec2(-AB.y,AB.x);",
        "  float d=dot(p-A,N);",
        "  float band=exp(-d*d/.085);",
        "  float bandW=exp(-d*d/.4);",

        "  vec2 sp=p*1.25+uSeed;",
        "  vec2 q=vec2(fbm(sp),fbm(sp+vec2(5.2,1.3)));",
        "  vec2 r=vec2(fbm(sp+3.6*q+vec2(1.7,9.2)),fbm(sp+3.6*q+vec2(8.3,2.8)));",
        "  float f=fbm(sp+3.2*r);",

        "  float dens=smoothstep(.4,.95,f+.34*band-.1)*(.12+.88*bandW);",
        "  vec3 cDeep=vec3(.05,.10,.30),cTeal=vec3(.06,.42,.58),cRose=vec3(.82,.24,.40),cPeach=vec3(1.,.58,.38);",
        "  vec3 neb=mix(cDeep,cTeal,smoothstep(.2,.85,q.y));",
        "  neb=mix(neb,cRose,smoothstep(.36,.8,r.x)*(.45+.55*band));",
        "  neb=mix(neb,cPeach,clamp(smoothstep(.52,.9,f)*band*1.25,0.,1.));",
        "  col+=neb*dens*1.05;",
        // glowing filaments along the brightest ridges
        "  col+=vec3(1.,.8,.66)*pow(smoothstep(.55,1.,f),3.)*band*.6;",
        // dark dust lanes inside the band
        "  float dust=smoothstep(.47,.78,fbm(p*3.4+r*2.3+11.));",
        "  col*=1.-.6*dust*bandW;",

        // tilted spiral galaxy, where the planets were
        "  vec2 gc=tall?vec2(.66*asp,.72):vec2(.77*asp,.5);",
        "  float R=tall?.5*asp:.42;",
        "  vec2 v=p-gc;",
        "  float an=-.42;v=mat2(cos(an),-sin(an),sin(an),cos(an))*v;",
        "  v.y/=.4;",
        "  float rr=length(v)/R;",
        "  float th=atan(v.y,v.x);",
        "  float cl=fbm(v/R*5.+3.);",
        "  float ph=2.*(th-2.7*log(rr+.05))+cl*1.7;",
        "  float arm=pow(.5+.5*cos(ph),3.);",
        "  float disk=exp(-rr*1.9)*smoothstep(1.35,.3,rr);",
        "  float bulge=exp(-rr*rr*60.);",
        "  float halo=exp(-rr*5.5);",
        "  vec3 gal=vec3(.62,.74,1.)*disk*(.14+1.45*arm*(.5+.8*cl));",
        "  gal+=vec3(1.,.46,.62)*disk*arm*smoothstep(.58,.78,cl)*1.2;",
        "  float lane=pow(.5+.5*cos(ph-.95),5.)*smoothstep(.12,.45,rr)*smoothstep(.42,.7,fbm(v/R*12.));",
        "  gal*=1.-.7*lane;",
        "  gal+=vec3(1.,.85,.64)*(bulge*1.3+halo*.38)+vec3(.55,.62,.9)*exp(-rr*1.2)*.05;",
        "  col*=1.-.5*exp(-rr*1.6);",
        "  col=1.-(1.-col)*(1.-min(gal*1.15,vec3(1.)));",

        // dense star field, richer inside the band and the galaxy
        "  float sd=.3+.85*bandW+1.4*disk;",
        "  col+=starLayer(p,210.,.885,.42)*sd;",
        "  col+=starLayer(p,95.,.9,.8)*(.55+.6*bandW);",
        "  col+=starLayer(p,38.,.955,1.)*.9;",

        // gentle vignette, tone map, dither against banding
        "  vec2 vv=uv-.5;col*=1.-.55*dot(vv,vv);",
        "  col=1.-exp(-col*1.3);",
        "  col=pow(col,vec3(1.04));",
        "  col+=(hash12(gl_FragCoord.xy+uSeed)-.5)/255.;",
        "  gl_FragColor=vec4(col,1.);",
        "}"
    ].join("\n");

    var nebula = document.querySelector(".nebula");
    var gl = nebula && (nebula.getContext("webgl", { antialias: false, preserveDrawingBuffer: true }) ||
                        nebula.getContext("experimental-webgl", { antialias: false, preserveDrawingBuffer: true }));

    function compile(type, src) {
        var sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn("sky shader:", gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }

    var prog = null, uRes, uSeed, uPx;
    if (gl) {
        var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
        if (vs && fs) {
            prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null;
        }
    }
    var SEED = 7.31;           // fixed so the sky looks the same on every visit
    var lastW = 0, lastH = 0;

    if (!prog) {
        // no WebGL: the CSS gradient on .sky stands in, the twinkling stars still run
        if (nebula) nebula.style.display = "none";
    } else {
        gl.useProgram(prog);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, "a");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uRes = gl.getUniformLocation(prog, "uRes");
        uSeed = gl.getUniformLocation(prog, "uSeed");
        uPx = gl.getUniformLocation(prog, "uPx");
    }

    function renderNebula() {
        if (!prog) return;
        var w = nebula.clientWidth, h = nebula.clientHeight;
        if (!w || !h) return;
        var scale = Math.min(window.devicePixelRatio || 1, 2);
        // keep the one-off render reasonable on very large screens
        var maxPx = 7e6;
        if (w * h * scale * scale > maxPx) scale = Math.sqrt(maxPx / (w * h));
        nebula.width = Math.round(w * scale);
        nebula.height = Math.round(h * scale);
        gl.viewport(0, 0, nebula.width, nebula.height);
        gl.uniform2f(uRes, nebula.width, nebula.height);
        gl.uniform1f(uSeed, SEED);
        gl.uniform1f(uPx, scale);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        lastW = w; lastH = h;
    }

    renderNebula();

    /* ---------- 2. Bright stars that twinkle, in depth layers (2D canvas) ---------- */

    var canvas = document.querySelector(".stars");
    var ctx = canvas.getContext("2d");

    var LAYERS = [
        { share: 0.55, r: [0.5, 0.85], a: [0.35, 0.7], speed: 0.03, drift: 4 },
        { share: 0.33, r: [0.75, 1.15], a: [0.5, 0.85], speed: 0.07, drift: 9 },
        { share: 0.12, r: [1.05, 1.55], a: [0.7, 0.95], speed: 0.13, drift: 16 }
    ];
    var TINTS = ["255,255,255", "255,250,244", "226,236,255", "200,218,255", "255,232,212"];

    var W = 0, H = 0, dpr = 1;
    var stars = [], flares = [], flareSprite = null;
    var mx = 0, my = 0, tx = 0, ty = 0;
    var running = false, last = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeFlareSprite() {
        var s = 96, c = document.createElement("canvas");
        c.width = c.height = s * 2;
        var g = c.getContext("2d");
        g.translate(s, s);
        g.globalCompositeOperation = "lighter";
        // wide, faint bluish bloom
        var bloom = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.55);
        bloom.addColorStop(0, "rgba(200,220,255,0.28)");
        bloom.addColorStop(0.35, "rgba(170,196,255,0.08)");
        bloom.addColorStop(1, "rgba(170,196,255,0)");
        g.fillStyle = bloom;
        g.beginPath(); g.arc(0, 0, s * 0.55, 0, 6.283); g.fill();
        // hot core
        var core = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.09);
        core.addColorStop(0, "rgba(255,255,255,1)");
        core.addColorStop(0.4, "rgba(255,246,236,0.75)");
        core.addColorStop(1, "rgba(255,236,220,0)");
        g.fillStyle = core;
        g.beginPath(); g.arc(0, 0, s * 0.09, 0, 6.283); g.fill();
        // long, fine diffraction spikes: two strong, two faint diagonals
        [[0, 1, 1], [Math.PI / 2, 1, 1], [Math.PI / 4, 0.42, 0.28], [-Math.PI / 4, 0.42, 0.28]].forEach(function (sp) {
            g.save(); g.rotate(sp[0]);
            var len = s * sp[1];
            var lg = g.createLinearGradient(-len, 0, len, 0);
            lg.addColorStop(0, "rgba(220,232,255,0)");
            lg.addColorStop(0.42, "rgba(236,242,255," + (0.35 * sp[2]) + ")");
            lg.addColorStop(0.5, "rgba(255,255,255," + (0.9 * sp[2]) + ")");
            lg.addColorStop(0.58, "rgba(236,242,255," + (0.35 * sp[2]) + ")");
            lg.addColorStop(1, "rgba(220,232,255,0)");
            g.fillStyle = lg;
            g.fillRect(-len, -0.5, len * 2, 1);
            g.restore();
        });
        return c;
    }

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var total = Math.round(Math.min(170, Math.max(60, (W * H) / 9000)));
        stars = [];
        LAYERS.forEach(function (L, li) {
            var n = Math.round(total * L.share);
            for (var i = 0; i < n; i++) {
                stars.push({
                    l: li,
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: rand(L.r[0], L.r[1]),
                    a: rand(L.a[0], L.a[1]),
                    c: TINTS[(Math.random() * TINTS.length) | 0],
                    tw: Math.random() < 0.22 ? { p: rand(3.5, 8), o: Math.random() * 6.28 } : null
                });
            }
        });

        // a few bright stars, kept clear of the text columns
        flares = [];
        var spots = W < 700
            ? [[0.82, 0.12, 0.42], [0.9, 0.46, 0.3]]
            : [[0.6, 0.12, 0.5], [0.93, 0.2, 0.36], [0.86, 0.78, 0.44], [0.71, 0.9, 0.28], [0.97, 0.56, 0.3]];
        spots.forEach(function (sp) {
            flares.push({ x: W * sp[0], y: H * sp[1], s: sp[2], p: rand(5, 9), o: Math.random() * 6.28 });
        });
        if (!flareSprite) flareSprite = makeFlareSprite();
    }

    function draw(t) {
        var sy = window.scrollY || 0;
        mx += (tx - mx) * 0.04;
        my += (ty - my) * 0.04;

        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i], L = LAYERS[s.l];
            var y = s.y - sy * L.speed + my * L.drift;
            y = ((y % H) + H) % H;
            var x = s.x + mx * L.drift;
            var a = s.a;
            if (s.tw && !reduce) a *= 0.5 + 0.5 * Math.sin(t / 1000 * (6.283 / s.tw.p) + s.tw.o);
            ctx.globalAlpha = a;
            ctx.fillStyle = "rgb(" + s.c + ")";
            ctx.beginPath();
            ctx.arc(x, y, s.r, 0, 6.283);
            ctx.fill();
        }

        ctx.globalCompositeOperation = "lighter";
        for (var k = 0; k < flares.length; k++) {
            var F = flares[k];
            var fy = F.y - sy * 0.1 + my * 12;
            fy = ((fy % H) + H) % H;
            var pulse = reduce ? 1 : 0.82 + 0.18 * Math.sin(t / 1000 * (6.283 / F.p) + F.o);
            var size = 192 * F.s;
            ctx.globalAlpha = pulse;
            ctx.drawImage(flareSprite, F.x + mx * 12 - size / 2, fy - size / 2, size, size);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
    }

    function loop(t) {
        if (!running) return;
        if (t - last > 32) { draw(t); last = t; }   // ~30fps is plenty for slow twinkles
        requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } }
    function stop() { running = false; }

    build();
    draw(performance.now());

    if (reduce) {
        window.addEventListener("scroll", function () { requestAnimationFrame(function () { draw(0); }); }, { passive: true });
    } else {
        start();
        document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
        if (finePointer) {
            window.addEventListener("pointermove", function (e) {
                tx = (e.clientX / window.innerWidth - 0.5) * -1;
                ty = (e.clientY / window.innerHeight - 0.5) * -1;
            }, { passive: true });
        }
    }

    var rt;
    window.addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
            build();
            draw(performance.now());
            // re-render the nebula only for real size changes, not a phone's address bar
            var w = nebula ? nebula.clientWidth : 0, h = nebula ? nebula.clientHeight : 0;
            if (prog && Math.abs(w - lastW) > 40 || Math.abs(h - lastH) / (lastH || 1) > 0.2) renderNebula();
        }, 200);
    });
})();
