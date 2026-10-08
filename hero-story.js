import { previewFrame } from './demo-model.js';

// One illustrative film. Its frames never mutate the interactive sample's
// wallet/history, and its own effects can pause without losing their position.
export function createHeroStory({ reduceMotion, sprite, putBowl, restore, startDelay = 1200 }) {
  const room = document.querySelector('#room');
  const panel = document.querySelector('#hero-story');
  const toggle = document.querySelector('#hero-story-toggle');
  const replay = document.querySelector('#hero-story-replay');
  const toggleLabel = toggle.querySelector('[data-story-toggle-label]');
  const caption = document.querySelector('#hero-story-caption');
  const dust = document.querySelector('#hero-story-dust');
  const status = panel.querySelector('[data-story-status]');
  const progress = panel.querySelector('[data-story-progress]');
  const steps = [...panel.querySelectorAll('[data-story-step]')];
  const effects = new Set(), transients = new Set();
  const ease = 'cubic-bezier(.22,.68,.28,1)';
  const captions = [
    '25 minutes of focus with Mino.',
    'Session complete. A leaf for your bowl.',
    'Focused time becomes a lasting trace.',
    'Choose a detail for your room.',
    'Your room becomes a little more yours.',
    '2 focused hours. Your Reading chapter grows.',
    '6 focused hours. Another layer takes shape.',
    '15 focused hours. Your chapter grows richer.',
    'A chapter finished. A memory kept.'
  ];
  // The first four seconds illustrate 25 minutes; individual decor arrivals follow. Total: 18.2s.
  const durations = [4000, 1500, 1600, 1400, 2500, 1700, 1700, 1900, 1900];
  const totalDuration = durations.reduce((total, duration) => total + duration, 0);
  let progressAnimation = null;
  let phase = -1, generation = 0, timer = null, deadline = 0, remaining = 0;
  let running = false, visible = false, started = false, manual = false;
  let takenOver = false, finished = false, destroyed = false;
  let startReady = false, startTimer = null;
  const view = document.defaultView;
  function onLoaded() {
    view?.removeEventListener('load', onLoaded);
    const ready = () => {
      startTimer = null;
      if (destroyed) return;
      startReady = true;
      updateControls();
      if (visible && !manual) play();
    };
    if (startDelay <= 0) ready();
    else startTimer = setTimeout(ready, startDelay);
  }

  const target = selector => room.querySelector(selector);
  const focusClock = target('.focus-clock'), focusTime = target('[data-focus-time]'), focusVeil = target('.focus-veil');
  let focusRAF = null;
  function stopFocusTick() { cancelAnimationFrame(focusRAF); focusRAF = null; }
  function clearFocus() {
    stopFocusTick();
    if (focusClock) focusClock.hidden = true;
    if (focusVeil) focusVeil.style.opacity = '0';
  }
  function tickFocus() {
    stopFocusTick();
    if (phase !== 0 || !running || destroyed || reduceMotion.matches) return;
    const seconds = Math.ceil(1500 * Math.max(0, deadline - performance.now()) / durations[0]);
    if (focusTime) focusTime.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    focusRAF = requestAnimationFrame(tickFocus);
  }
  const deskGroups = [
    ['.placed-lamp', '.desk-cup'],
    ['.desk-mat', '.desk-notes', '.desk-pencil'],
    ['.desk-tray', '.desk-pencil-cup', '.desk-headphones']
  ].map(group => group.map(target));
  const deskProps = deskGroups.flat();
  function updateControls() {
    const reduced = reduceMotion.matches;
    const state = reduced ? 'reduced' : takenOver ? 'interactive' : finished ? 'finished' : !startReady ? 'waiting' : running ? 'playing' : 'paused';
    room.dataset.storyState = state;
    panel.dataset.state = state;
    toggle.disabled = !startReady || reduced || finished || takenOver;
    if (toggleLabel) toggleLabel.textContent = reduced ? 'Still preview' : running ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', reduced ? 'Static example with reduced motion' : running ? 'Pause animated example' : 'Play animated example');
    toggle.setAttribute('aria-pressed', String(running));
    if (replay) replay.disabled = !startReady || reduced;
    if (status) status.textContent = reduced ? 'Still preview' : finished ? 'Example complete' : 'Accelerated preview';
  }
  function markStep(index) {
    const step = index < 1 ? 'focus' : index < 3 ? 'keep' : index < 5 ? 'choose' : 'grow';
    panel.dataset.step = step;
    steps.forEach(element => {
      const current = element.dataset.storyStep === step;
      element.classList.toggle('is-current', current);
      if (current) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
    });
  }
  function paint(frame, pose = 'idle') {
    // A furnished-room example at the decor stage, not purchases or rewards.
    deskProps.forEach(prop => { prop.hidden = !frame.owned.includes('fern'); });
    target('.placed-fern').hidden = !frame.owned.includes('fern');
    target('.room-box').hidden = !frame.sealed;
    target('.room-ceramic').hidden = frame.leaves < 35;
    target('.scene-chapter').src = sprite(`reading-${frame.viewedForm}`);
    target('.scene-chapter').alt = `Reading chapter example, form ${frame.viewedForm}`;
    target('.room-mino').src = sprite(`mino-${pose}`);
    putBowl(target('[data-bowl="room"]'), frame.leaves);
    // No shared counter RAF: a superseded film cannot repaint the new balance.
    dust.textContent = String(frame.dust);
  }
  function discardEffects(keepProgress = false) {
    effects.forEach(animation => {
      if (keepProgress && animation === progressAnimation) return;
      animation.cancel(); effects.delete(animation);
    });
    if (!keepProgress) progressAnimation = null;
    transients.forEach(node => node.remove());
    transients.clear();
  }
  function invalidate() {
    generation++;
    clearTimeout(timer); timer = null;
    running = false;
    discardEffects();
    clearFocus();
  }
  function effect(element, keyframes, options = {}, transient = null) {
    if (!element?.animate || !running || reduceMotion.matches) { transient?.remove(); return; }
    const animation = element.animate(keyframes, { duration: 600, easing: ease, fill: 'both', ...options });
    effects.add(animation);
    if (transient) transients.add(transient);
    const release = () => {
      // Cleanup is idempotent and never paints: cancelled runs cannot touch
      // the frame, pose or balance installed by replay/takeover/resize.
      if (effects.delete(animation)) animation.cancel();
      if (transient) { transient.remove(); transients.delete(transient); }
    };
    animation.finished.then(release, release);
    return animation;
  }
  function paintProgress(value) {
    if (progress) progress.style.transform = `scaleX(${value})`;
  }
  function startProgress() {
    if (!progress?.animate) return;
    // A single linear timeline crosses the three spatial gaps. Caption/pose
    // transitions never cancel it, so progress cannot jump at phase changes.
    const boundaries = [0, 1, 3, 5, durations.length];
    const keyframes = boundaries.map((index, stage) => ({
      transform: `scaleX(${Math.min(stage, 3) / 3})`,
      offset: durations.slice(0, index).reduce((total, duration) => total + duration, 0) / totalDuration
    }));
    progressAnimation = progress.animate(keyframes, { duration: totalDuration, easing: 'linear', fill: 'both' });
    effects.add(progressAnimation);
    // Lifecycle cleanup owns cancellation and installs the final/reset fill.
    progressAnimation.finished.catch(() => {});
  }
  function arrival(element, duration = 620) {
    effect(element, [{ opacity: 0, transform: 'translateY(7px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration });
  }
  function flight(source, destination, asset, { width, duration = 850, leaf = false, star = false } = {}) {
    if (!source || !destination) return;
    const from = source.getBoundingClientRect(), to = destination.getBoundingClientRect();
    const layer = leaf ? destination : room.closest('.opening');
    if (!layer || !from.width || !to.width) return;
    const local = layer.getBoundingClientRect();
    const node = document.createElement(star ? 'span' : 'img');
    node.className = `flight scene-flight${star ? ' dust-flight' : ''}`;
    node.setAttribute('aria-hidden', 'true');
    if (star) node.textContent = '✦';
    else { node.src = asset; node.alt = ''; }
    const size = width ?? (star ? 22 : to.width);
    const x = from.left + from.width / 2 - local.left - size / 2;
    const y = from.top + from.height / 2 - local.top - size / 2;
    const endX = leaf ? to.left + to.width * .44 - size / 2 : star ? to.left + to.width / 2 - size / 2 : to.left;
    const endY = leaf ? to.top + to.height * .28 - size / 2 : star ? to.top + to.height / 2 - size / 2 : to.top;
    const dx = endX - local.left - x, dy = endY - local.top - y;
    const lift = Math.min(80, Math.max(24, Math.abs(dx) * .15));
    node.style.left = `${x}px`; node.style.top = `${y}px`; node.style.width = `${size}px`;
    layer.append(node);
    return effect(node, [
      { opacity: 0, transform: 'translate(0,0) rotate(-7deg) scale(.92)' },
      { opacity: 1, transform: `translate(${dx * .42}px,${dy * .42 - lift}px) rotate(-2deg) scale(1)`, offset: .42 },
      { opacity: 1, transform: `translate(${dx}px,${dy}px) rotate(0deg) scale(1)` }
    ], { duration }, node);
  }
  function changeChapter(frame) {
    const current = target('.scene-chapter');
    const outgoing = current.cloneNode();
    outgoing.removeAttribute('id'); outgoing.alt = '';
    outgoing.classList.add('story-chapter-outgoing');
    current.parentElement.append(outgoing);
    paint(frame);
    effect(outgoing, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.025)' }], { duration: 600 }, outgoing);
    effect(current, [{ opacity: 0, transform: 'translateY(5px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 700 });
  }
  function enterPhase() {
    discardEffects(true);
    caption.textContent = captions[phase]; markStep(phase);
    const frame = previewFrame(phase);
    effect(caption, [{ opacity: .25, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260 });
    if (phase === 0) {
      paint(frame, 'working');
      if (focusClock) focusClock.hidden = false;
      if (focusTime) focusTime.textContent = '25:00';
      if (focusVeil) focusVeil.style.opacity = '.36';
      effect(focusVeil, [{opacity:0},{opacity:.36}], {duration:650});
      // Mino remains seated while focusing; only the light settles, not its feet.
      effect(target('.room-mino'), [{ opacity: .55 }, { opacity: 1 }], { duration: 650 });
    } else if (phase === 1) {
      stopFocusTick();
      if (focusTime) focusTime.textContent = '00:00';
      if (focusVeil) focusVeil.style.opacity = '0';
      effect(focusVeil, [{opacity:.36},{opacity:0}], {duration:500});
      paint({ ...frame, leaves: previewFrame(0).leaves }, 'completion');
      const token = generation;
      const addArrivedLeaf = () => {
        if (token === generation && phase === 1 && !destroyed && !takenOver) putBowl(target('[data-bowl="room"]'), previewFrame(2).leaves);
      };
      const leafFlight = flight(target('.room-mino'), target('.room-bowl'), sprite('leaf-sage'), { leaf: true, width: Math.max(18, target('.room-bowl').getBoundingClientRect().width * .22), duration: 950 });
      // Only a successful arrival paints the receipt. Cancellation rejects
      // finished; replay/resize also invalidate the callback's generation.
      if (leafFlight) leafFlight.finished.then(addArrivedLeaf, () => {});
      else addArrivedLeaf();
    } else if (phase === 2) {
      clearFocus();
      paint(frame, 'completion');
      flight(target('.room-bowl'), dust, null, { star: true, duration: 750 });
      effect(dust.parentElement, [{ transform: 'scale(1)' }, { transform: 'scale(1.055)', offset: .6 }, { transform: 'scale(1)' }], { duration: 820 });
    } else if (phase === 3) {
      paint(frame);
      effect(panel.querySelector('[data-story-step="choose"]')?.querySelector('svg'), [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .5 }, { transform: 'scale(1)' }], { duration: 700 });
    } else if (phase === 4) {
      paint(frame);
      deskProps.forEach((prop, index) => {
        effect(prop, [
          { opacity: 0, transform: 'translateY(10px) scale(.96)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 460, delay: index * 260 });
      });
      const fern = target('.placed-fern');
      const source = panel.querySelector('[data-story-step="choose"]');
      flight(source?.querySelector('svg') || source, fern, sprite('fern'), { duration: 850 });
      effect(fern, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 0, offset: .75 }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1080 });
    } else if (phase < 8) {
      changeChapter(frame);
      if (phase === 7) arrival(target('.room-ceramic'));
    } else {
      paint(frame); arrival(target('.room-box'), 700);
    }
    remaining = durations[phase]; schedule(); tickFocus();
  }
  function schedule() {
    const token = generation;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      if (!running || token !== generation || destroyed) return;
      if (phase === captions.length - 1) {
        running = false; finished = true; discardEffects(); paintProgress(1); updateControls();
      } else { phase++; enterPhase(); }
    }, remaining);
  }
  function canRun() {
    return startReady && !destroyed && visible && !reduceMotion.matches && !document.hidden && !document.documentElement.classList.contains('motion-paused');
  }
  function play() {
    if (running || finished || takenOver || !canRun()) return;
    manual = false; running = true;
    if (!started) { started = true; phase = 0; startProgress(); enterPhase(); }
    else { effects.forEach(animation => animation.play()); schedule(); tickFocus(); }
    updateControls();
  }
  function pause({ manual: userPause = false } = {}) {
    if (userPause) manual = true;
    if (running) {
      remaining = Math.max(0, deadline - performance.now());
      clearTimeout(timer); timer = null; running = false;
      effects.forEach(animation => animation.pause());
      stopFocusTick();
    }
    updateControls();
  }
  function settle(reduced = false) {
    invalidate(); phase = 8; started = true; finished = true; manual = false; takenOver = false;
    paint(previewFrame(8)); markStep(8); paintProgress(1);
    caption.textContent = reduced ? 'A completed chapter, kept. Reduced-motion preview.' : captions[8];
    updateControls();
  }
  function restart() {
    if (reduceMotion.matches || destroyed) return;
    invalidate(); phase = -1; started = false; finished = false; manual = false; takenOver = false;
    paint(previewFrame(0)); markStep(0); paintProgress(0); caption.textContent = captions[0]; updateControls(); play();
  }
  function takeOver() {
    invalidate(); takenOver = true; manual = true;
    caption.textContent = 'Your turn. Choose how the room grows.';
    restore(); updateControls();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].intersectionRatio >= .35;
    if (!visible) pause();
    else if (!manual) play();
  }, { threshold: .35 });
  const onToggle = () => running ? pause({ manual: true }) : play();
  const onVisibility = () => document.hidden ? pause() : visible && !manual && play();
  const onMotion = () => {
    if (reduceMotion.matches && !takenOver) settle(true);
    else updateControls();
  };
  const onPreference = () => {
    if (document.documentElement.classList.contains('motion-paused')) pause();
    else if (!manual) play();
  };
  clearFocus();
  panel.hidden = false;
  if (reduceMotion.matches) settle(true);
  else { paint(previewFrame(0)); markStep(0); paintProgress(0); updateControls(); }
  if (document.readyState === 'complete') onLoaded();
  else view?.addEventListener('load', onLoaded, {once:true});
  observer.observe(room);
  toggle.addEventListener('click', onToggle);
  replay?.addEventListener('click', restart);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('motionpreferencechange', onPreference);
  reduceMotion.addEventListener('change', onMotion);
  return {
    pause, takeOver,
    finishOnResize() { if (started && !takenOver && !destroyed) settle(reduceMotion.matches); },
    destroy() {
      clearTimeout(startTimer); startTimer = null;
      view?.removeEventListener('load', onLoaded);
      destroyed = true; invalidate(); observer.disconnect();
      toggle.removeEventListener('click', onToggle); replay?.removeEventListener('click', restart);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('motionpreferencechange', onPreference);
      reduceMotion.removeEventListener?.('change', onMotion);
    }
  };
}
