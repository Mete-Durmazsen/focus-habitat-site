(() => {
  'use strict';
  const root = document.documentElement;
  const scene = document.getElementById('deskScene');
  const lamp = document.getElementById('deskLamp');
  const book = document.getElementById('deskBook');
  const mino = document.getElementById('deskMino');
  const pose = document.getElementById('minoPose');
  const note = document.getElementById('chapterNote');
  const status = document.getElementById('deskStatus');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let greetingTimeout = 0;

  // Lighting is ambient. It never adds or removes an earned trace.
  lamp.addEventListener('click', () => {
    const on = scene.dataset.lamp !== 'on';
    scene.dataset.lamp = on ? 'on' : 'off';
    lamp.setAttribute('aria-pressed', String(on));
    lamp.setAttribute('aria-label', `Turn the desk lamp ${on ? 'off' : 'on'}`);
    status.textContent = on ? 'A little light. Everything you kept is still here.' : 'Lights out. Nothing in your room is lost.';
  });

  function setChapter(open, restoreFocus = false) {
    book.setAttribute('aria-expanded', String(open));
    book.setAttribute('aria-label', `${open ? 'Close' : 'Open'} the chapter notebook`);
    note.hidden = !open;
    status.textContent = open ? 'A chapter grows from the time you give it.' : 'Your chapter will be here when you return.';
    if (restoreFocus) book.focus();
  }
  book.addEventListener('click', () => setChapter(book.getAttribute('aria-expanded') !== 'true'));
  document.getElementById('closeChapter').addEventListener('click', () => setChapter(false, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !note.hidden) setChapter(false, true);
  });

  const resetGreeting = () => {
    clearTimeout(greetingTimeout);
    mino.classList.remove('is-greeting');
    pose.src = 'assets/room/mino-idle.png';
  };
  mino.addEventListener('click', () => {
    resetGreeting();
    pose.src = 'assets/room/mino-touch.png';
    if (!motion.matches) mino.classList.add('is-greeting');
    status.textContent = 'Mino says hello. Ready whenever you are.';
    greetingTimeout = setTimeout(resetGreeting, 1600);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetGreeting(); });
  motion.addEventListener('change', () => { if (motion.matches) mino.classList.remove('is-greeting'); });

  // Warm the exact existing reaction image, so the first hello never waits on a download.
  const greeting = new Image();
  greeting.src = 'assets/room/mino-touch.png';
  [lamp, book, mino].forEach(button => { button.disabled = false; });
  root.classList.remove('no-js');
})();
