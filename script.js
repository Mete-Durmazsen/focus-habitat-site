(() => {
  'use strict';
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  const reduced = () => motion.matches;
  const visibleAnimations = new Set();
  root.classList.remove('no-js');
  root.classList.add('enhanced');

  // Reveal once; the unenhanced page is always readable if JavaScript is unavailable.
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  }), {threshold: .08});
  document.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));

  const theme = document.getElementById('themeToggle');
  theme?.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    theme.setAttribute('aria-pressed', String(dark));
    theme.setAttribute('aria-label', dark ? 'Switch to daylight colours' : 'Switch to evening colours');
  });

  function animate(el, frames, options, done) {
    if (reduced()) { done?.(); return; }
    const effect = el.animate(frames, options);
    visibleAnimations.add(effect);
    effect.finished.then(() => { visibleAnimations.delete(effect); done?.(); }).catch(() => {
      visibleAnimations.delete(effect); done?.();
    });
  }

  // One shared frame follows the document's true aspect ratio, never a cropped image.
  const stage = document.getElementById('heroStage');
  const play = document.getElementById('playPreview');
  const playText = document.getElementById('previewButtonText');
  const time = document.getElementById('chipTime');
  const stateText = document.getElementById('previewState');
  const caption = document.getElementById('previewCaption');
  const progress = document.getElementById('previewProgress');
  const announcement = document.getElementById('previewAnnouncement');
  const receipt = document.getElementById('leafReceipt');
  const heroLeaves = document.getElementById('heroLeaves');
  let running = false, started = 0, frame = 0, receiptTimeout = 0, generation = 0;
  const duration = 12000;

  function screen(state) {
    stage.dataset.state = state;
    document.querySelectorAll('[data-hero-screen]').forEach(img => {
      const active = img.dataset.heroScreen === state;
      img.classList.toggle('is-active', active);
      img.setAttribute('aria-hidden', String(!active));
    });
  }
  function stop() {
    generation++;
    running = false;
    cancelAnimationFrame(frame);
    clearTimeout(receiptTimeout);
    receipt.classList.remove('is-visible');
    screen('ready');
    time.textContent = '25:00';
    progress.style.transform = 'scaleX(0)';
    stateText.textContent = 'A little time for you';
    caption.textContent = 'One session. One small beginning.';
    playText.textContent = 'Try a quiet moment';
    announcement.textContent = 'Preview stopped. Nothing was saved.';
  }
  function flyLeaf(from, target, done) {
    if (reduced()) { done(); return; }
    const leaf = document.createElement('img');
    leaf.src = 'assets/room/leaf-sage.png';
    leaf.alt = '';
    leaf.className = 'flying-leaf';
    leaf.setAttribute('aria-hidden', 'true');
    leaf.style.left = from.x + 'px';
    leaf.style.top = from.y + 'px';
    document.body.append(leaf);
    const x = target.x - from.x, y = target.y - from.y;
    animate(leaf, [
      {transform:'translate(0,0) rotate(-20deg)',opacity:0},
      {transform:`translate(${x*.15}px,${Math.min(-80,y*.2)}px) rotate(10deg)`,opacity:1,offset:.2},
      {transform:`translate(${x*.65}px,${y*.55}px) rotate(-35deg)`,opacity:1,offset:.65},
      {transform:`translate(${x}px,${y}px) rotate(-12deg) scale(.8)`,opacity:1}
    ], {duration:1400,easing:'cubic-bezier(.25,.1,.25,1)',fill:'forwards'}, () => {
      leaf.remove(); done();
    });
  }
  function complete() {
    const completedGeneration = generation;
    running = false;
    screen('complete');
    time.textContent = '00:00';
    stateText.textContent = 'A little time, kept.';
    caption.textContent = 'Your room remembers.';
    playText.textContent = 'Replay this little moment';
    announcement.textContent = 'Preview complete. A leaf joins the bowl. Your real progress has not changed.';
    const phone = stage.querySelector('.phone').getBoundingClientRect();
    const bowl = stage.querySelector('.hero-bowl').getBoundingClientRect();
    flyLeaf({x:phone.left+phone.width*.45,y:phone.top+phone.height*.6},
      {x:bowl.left+bowl.width*.48,y:bowl.top+bowl.height*.22}, () => {
        if (generation !== completedGeneration || stage.dataset.state !== 'complete') return;
        // Replace the preview leaf on replay rather than accumulating unlimited nodes.
        heroLeaves.innerHTML = '<img src="assets/room/leaf-sage.png" alt=""><img src="assets/room/leaf-walnut.png" alt="" style="left:40%;top:8%;width:42%;transform:rotate(20deg)">';
        receipt.classList.add('is-visible');
        receiptTimeout = setTimeout(() => receipt.classList.remove('is-visible'), 3000);
        animate(stage.querySelector('.hero-bowl'),[{transform:'scale(1)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],{duration:550});
      });
  }
  function tick(now) {
    if (!running) return;
    const p = Math.min(1, (now-started)/duration);
    const remaining = Math.ceil((1-p)*1500);
    time.textContent = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    progress.style.transform = `scaleX(${p})`;
    if (p>=1) complete(); else frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click', () => {
    if (running) { stop(); return; }
    generation++;
    clearTimeout(receiptTimeout);
    receipt.classList.remove('is-visible');
    heroLeaves.innerHTML = '<img src="assets/room/leaf-sage.png" alt="">';
    screen('focus');
    stateText.textContent = 'A quiet moment with Mino';
    caption.textContent = '25 minutes, shown in 12 seconds.';
    playText.textContent = 'Stop the preview';
    announcement.textContent = 'Accelerated preview started. A 25-minute session is shown in 12 seconds.';
    started=performance.now(); running=true; frame=requestAnimationFrame(tick);
  });
  stage.addEventListener('pointermove', e => {
    if (reduced() || e.pointerType !== 'mouse') return;
    const box=stage.getBoundingClientRect();
    stage.style.setProperty('--glow-x',`${20+(e.clientX-box.left)/box.width*35}%`);
    stage.style.setProperty('--glow-y',`${15+(e.clientY-box.top)/box.height*20}%`);
  });

  const steps=[...document.querySelectorAll('[data-step]')];
  const storyButtons=[...document.querySelectorAll('[data-story-select]')];
  function setStep(index) {
    steps.forEach((el,i)=>el.classList.toggle('is-on',i===index));
    storyButtons.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
    document.querySelectorAll('[data-story-screen]').forEach((img,i)=>{
      img.classList.toggle('is-active',i===index);
      img.setAttribute('aria-hidden',String(i!==index));
    });
  }
  storyButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const index=Number(btn.dataset.storySelect);
    setStep(index);
    if (!mobile.matches) steps[index].scrollIntoView({block:'center',behavior:reduced()?'instant':'smooth'});
  }));
  const stepObserver=new IntersectionObserver(entries=>{
    if (mobile.matches) return;
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    if (visible.length) setStep(Number(visible[0].target.dataset.step));
  },{rootMargin:'-35% 0px -35% 0px',threshold:[0,.2,.5]});
  steps.forEach(el=>stepObserver.observe(el));
  mobile.addEventListener('change',()=>setStep(0));

  // Match LeafBowlRules: 35 visible slots; later leaves replace the oldest, never empty the bowl.
  const pile=document.getElementById('leafPile');
  const countText=document.getElementById('leafCount');
  const note=document.getElementById('leafNote');
  const bowl=document.getElementById('bowl');
  pile.replaceChildren();
  let credited=0;
  function addLeaf(instant=false) {
    credited++;
    const slot=(credited-1)%35;
    const season=Math.floor((credited-1)/35)+1;
    let leaf=pile.children[slot];
    if (!leaf) {leaf=document.createElement('img');leaf.alt='';pile.append(leaf);}
    leaf.src=season%2===0 || slot%4===0?'assets/room/leaf-walnut.png':'assets/room/leaf-sage.png';
    leaf.style.setProperty('--x',`${14+(slot*19)%56}%`);
    leaf.style.setProperty('--y',`${25-(Math.floor(slot/7)*3)+(slot%3)*2}%`);
    leaf.style.setProperty('--r',`${-40+(slot*31)%105}deg`);
    countText.textContent=credited;
    note.textContent=`leaves kept · season ${season}`;
    bowl.setAttribute('aria-label',`Preview bowl with ${Math.min(credited,35)} visible leaves; ${credited} leaves kept; season ${season}`);
    if (!instant) {
      const box=leaf.getBoundingClientRect();
      // The flying image is separate from the front rim's stacking context.
      leaf.style.visibility='hidden';
      flyLeaf({x:box.left-20,y:box.top-160},{x:box.left,y:box.top},()=>{
        leaf.style.visibility='visible';
        animate(bowl,[{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:450});
      });
    }
  }
  for (let i=0;i<7;i++) addLeaf(true);
  document.getElementById('dropLeaf').addEventListener('click',()=>addLeaf());

  // Hidden tabs do not keep ambient animations or the preview frame loop running.
  let stageVisible = true;
  function updateAmbient() {
    document.querySelectorAll('.ambient-leaf,.mino').forEach(el=>el.style.animationPlayState=document.hidden || !stageVisible?'paused':'running');
  }
  document.addEventListener('visibilitychange',()=>{
    updateAmbient();
    if(document.hidden && running)stop();
  });
  motion.addEventListener('change',()=>{
    if(reduced()) visibleAnimations.forEach(effect=>effect.finish());
  });
  const ambientObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    stageVisible=entry.isIntersecting;
    updateAmbient();
  }));
  ambientObserver.observe(stage);
})();
