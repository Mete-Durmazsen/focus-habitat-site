// Website-only sample data. This module never reads or writes application history.
export const forms = [
  { form: 1, minutes: 75, sessions: 3, label: 'First shape', detail: 'At least 3 completed sessions and 45 focused minutes.' },
  { form: 2, minutes: 120, sessions: 5, label: '2 hours', detail: 'A second layer joins your Reading chapter.' },
  { form: 3, minutes: 360, sessions: 15, label: '6 hours', detail: 'More focused time brings a new material and another layer.' },
  { form: 4, minutes: 900, sessions: 36, label: '15 hours', detail: 'Four layers hold the time you have given this chapter.' }
];
export function earnedForm(minutes, sessions) {
  if (sessions < 3 || minutes < 45) return 0;
  return minutes >= 900 ? 4 : minutes >= 360 ? 3 : minutes >= 120 ? 2 : 1;
}
export function freshDemo() {
  return { dust: 4, rewardedToday: 0, minutes: 75, sessions: 3, leaves: 3, owned: [], sealed: false, viewedForm: 1 };
}
export function transition(state, action) {
  if (action.type === 'reset') return freshDemo();
  if (action.type === 'complete') {
    if (state.sealed) return state;
    const reward = state.rewardedToday < 4 ? 2 : 0;
    const minutes = state.minutes + 25, sessions = state.sessions + 1;
    return { ...state, minutes, sessions, leaves: state.leaves + 1, dust: state.dust + reward,
      rewardedToday: state.rewardedToday + (reward > 0 ? 1 : 0), viewedForm: earnedForm(minutes, sessions) };
  }
  if (action.type === 'purchase') {
    if (!['lamp', 'fern'].includes(action.item) || state.dust < 6 || state.owned.includes(action.item)) return state;
    return { ...state, dust: state.dust - 6, owned: [...state.owned, action.item] };
  }
  if (action.type === 'inspect') {
    if (!Number.isInteger(action.form) || action.form < 1 || action.form > 4) return state;
    return { ...state, viewedForm: action.form };
  }
  if (action.type === 'grow') {
    if (state.sealed) return state;
    const target = forms.find(f => f.form === action.form);
    if (!target) return state;
    // A time-lapse advances sample history; inspecting earlier forms never revokes it.
    const sessions = Math.max(state.sessions, target.sessions);
    return { ...state, minutes: Math.max(state.minutes, target.minutes), sessions,
      leaves: state.leaves + Math.max(0, sessions - state.sessions), viewedForm: target.form };
  }
  if (action.type === 'seal') {
    if (state.sealed) return state;
    return { ...state, sealed: true, viewedForm: earnedForm(state.minutes, state.sessions) };
  }
  return state;
}

// Deterministic film frames. The opening film never mutates the interactive sample.
export function previewFrame(phase, item = 'fern') {
  let frame = freshDemo();
  if (phase >= 2) frame = transition(frame, { type: 'complete' });
  if (phase >= 4) frame = transition(frame, { type: 'purchase', item });
  if (phase >= 5) frame = transition(frame, { type: 'grow', form: Math.min(4, phase - 3) });
  if (phase >= 8) frame = transition(frame, { type: 'seal' });
  return frame;
}
