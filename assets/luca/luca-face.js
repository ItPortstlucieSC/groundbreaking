/* LucaFace · reproductor de la cara de Luca en video (loops "vivo" y "hablando").
   Los clips son <video data-luca="idle|talk" data-clip="idle-a"> apilados dentro de un marco; todos empiezan y terminan en el
   mismo cuadro (anclaje). Se muestra uno por vez con un fundido de opacidad (CSS: `.on`). Reglas para que no se note el cambio:
   - Un clip solo se corta en un tramo de REPOSO (cara y boca iguales al anclaje): al final del clip, o antes si hace falta
     cambiar de estado y el clip tiene un tramo de reposo a mano. Un clip de habla se deja terminar la frase.
   - Para empezar a hablar urge: si no hay reposo, se corta en un tramo "cerca" del reposo con un fundido más largo, y si
     tampoco hay, a los 600 ms con uno más largo todavía.
   - Al elegir el clip de habla se usa lo que falta de tipeo (`typing(untilMs)`): el más corto que lo cubra, así deja de hablar
     poco después de que el texto termina.
   Los tramos salen de `cuts.py` (docs/luca/face/ del repo del sitio del club): META de abajo = meta.json. Pegar de nuevo al regenerar.
   Uso: var face = LucaFace.mount(document.querySelector('.sc-port'));  face.set('talk'); face.typing(performance.now()+2800); face.set('idle');
   Fuente y método: docs/luca/face/README.md (repo PSLSC Website). */
(function(){
  var META = {"idle-a":{"dur":5.042,"rest":[[0.0,0.75],[3.83,5.0]],"soft":[[0.0,1.67],[3.46,5.0]],"speech":3.83},"idle-b":{"dur":5.042,"rest":[[0.0,0.67],[3.21,3.46],[4.0,5.0]],"soft":[[0.0,1.46],[3.08,3.5],[3.88,5.0]],"speech":4.0},"idle-c":{"dur":5.042,"rest":[[0.0,0.29]],"soft":[[0.0,0.67],[0.75,3.12],[3.25,5.0]],"speech":5.042},"talk-a":{"dur":6.042,"rest":[[0.0,0.46],[4.88,6.0]],"soft":[[0.0,0.5],[4.83,6.0]],"speech":4.88},"talk-b":{"dur":6.042,"rest":[[0.0,0.5],[4.0,6.0]],"soft":[[0.0,0.54],[3.83,6.0]],"speech":4.0},"talk-c":{"dur":4.042,"rest":[[0.0,0.17],[2.0,4.0]],"soft":[[0.0,0.21],[1.71,4.0]],"speech":2.0},"talk-d":{"dur":4.042,"rest":[[0.0,0.17],[1.88,4.0]],"soft":[[0.0,0.21],[1.5,4.0]],"speech":1.88}};
  var FADE_REST = 160, FADE_SOFT = 240, FADE_HARD = 320, HARD_AFTER = 900;
  function inRanges(rs, t){ for (var i = 0; i < rs.length; i++) if (t >= rs[i][0] && t <= rs[i][1]) return true; return false; }
  function mute(v){ v.muted = true; v.defaultMuted = true; v.volume = 0; } // Chrome ignora el `muted` del atributo en nodos salidos de un template

  function mount(port, opts){
    opts = opts || {};
    var meta = opts.meta || META;
    var vids = Array.prototype.slice.call(port.querySelectorAll('video'));
    var active = null, state = 'idle', want = 'idle', wantSince = 0, typingEnd = 0, ready = false, near = false, loaded = false, fading, raf;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function m(v){ return meta[v.getAttribute('data-clip')] || { dur: 5, rest: [[0, 0.3]], soft: [[0, 0.3]], speech: 5 }; }
    function alive(v){ return !v.error && !v.hasAttribute('data-dead'); } // un archivo que falta o no decodifica queda fuera
    function ofState(s){ return vids.filter(function(v){ return v.getAttribute('data-luca') === s && v !== active && alive(v); }); }
    function pickFor(s){
      var c = ofState(s); if (!c.length) c = vids.filter(function(v){ return v.getAttribute('data-luca') === s && alive(v); });
      if (!c.length) c = vids.filter(alive); if (!c.length) return active;
      if (s === 'idle'){ // al azar, con peso (data-weight): el "vivo" casi quieto sale más seguido, los de gesto son el condimento
        var tot = 0, ws = c.map(function(v){ var w = parseFloat(v.getAttribute('data-weight')) || 1; tot += w; return w; });
        var r = Math.random() * tot; for (var i = 0; i < c.length; i++){ r -= ws[i]; if (r <= 0) return c[i]; } return c[c.length - 1];
      }
      // habla: lo que falta de tipeo decide el largo. El más corto que lo cubra; si ninguno llega, el más largo.
      var left = typingEnd ? (typingEnd - performance.now()) / 1000 : 99;
      var cover = c.filter(function(v){ return m(v).speech >= left - 0.3; });
      if (cover.length) return cover.sort(function(a, b){ return m(a).speech - m(b).speech; })[0];
      return c.sort(function(a, b){ return m(b).speech - m(a).speech; })[0];
    }
    function show(v, prev){
      v.classList.add('on');
      if (prev && prev !== v){
        prev.classList.remove('on');
        clearTimeout(fading); fading = setTimeout(function(){ if (active !== prev) prev.pause(); }, parseFloat(prev.style.transitionDuration) + 40);
      }
    }
    function switchTo(v, fade){
      if (!v || v === active) return;
      var prev = active; active = v; ready = false; state = v.getAttribute('data-luca');
      v.style.transitionDuration = fade + 'ms'; if (prev) prev.style.transitionDuration = fade + 'ms';
      try { v.currentTime = 0; } catch(e){}
      mute(v);
      var onPlaying = function(){ v.removeEventListener('playing', onPlaying); if (active === v){ ready = true; show(v, prev); } };
      v.addEventListener('playing', onPlaying);
      var p = v.play(); if (p && p.catch) p.catch(function(){});
    }
    function loop(){
      raf = requestAnimationFrame(loop);
      if (!active || !ready || !near || active.paused) return;
      var t = active.currentTime, mm = m(active);
      var endAt = state === 'talk' ? mm.speech + 0.15 : mm.dur - 0.25; // en habla: apenas termina la frase (si sigue el tipeo, encadena otra)
      if (t >= endAt) return switchTo(pickFor(want), FADE_REST);
      if (want === state) return;
      if (inRanges(mm.rest, t)) return switchTo(pickFor(want), FADE_REST);
      if (want === 'talk'){
        if (inRanges(mm.soft, t)) return switchTo(pickFor('talk'), FADE_SOFT);
        if (performance.now() - wantSince > HARD_AFTER) return switchTo(pickFor('talk'), FADE_HARD);
      }
      // want === 'idle' en medio de una frase: se espera el reposo final (termina de hablar), lo cubre endAt
    }
    function load(){ if (loaded) return; loaded = true; vids.forEach(function(v){ v.preload = 'auto'; mute(v); v.load(); }); }
    function resume(){ if (active && active.paused && near){ mute(active); var p = active.play(); if (p && p.catch) p.catch(function(){}); } }
    function enter(){ load(); near = true; if (!active) switchTo(pickFor(want), 0); else resume(); }
    function leave(){ near = false; if (active) active.pause(); }

    vids.forEach(function(v){
      mute(v);
      v.addEventListener('ended', function(){ if (v === active && near) switchTo(pickFor(want), FADE_REST); }); // red de seguridad
      v.addEventListener('error', function(){ v.setAttribute('data-dead', '1'); if (v === active){ active = null; if (near) switchTo(pickFor(want), FADE_REST); } });
    });
    if (!reduced){
      if (opts.lazy === false || !('IntersectionObserver' in window)) enter();
      else { var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) enter(); else leave(); }); }, { rootMargin: '60% 0px 60% 0px' }); io.observe(port); }
      ['pointerdown', 'keydown', 'touchstart'].forEach(function(ev){ addEventListener(ev, resume, { passive: true }); }); // autoplay rechazado: reintento con el primer gesto
      document.addEventListener('visibilitychange', function(){ if (!document.hidden) resume(); });
      raf = requestAnimationFrame(loop);
    }
    return {
      set: function(s){ if (s === want) return; want = s; wantSince = performance.now(); },
      typing: function(untilMs){ typingEnd = untilMs || 0; },
      get state(){ return state; }, get want(){ return want; }, get clip(){ return active ? active.getAttribute('data-clip') : null; }
    };
  }
  window.LucaFace = { mount: mount, META: META };
})();
