export const initialExperience = {
  phase: 'entering',
  step: 0,
  pressed: [],
  mistakeMidi: null,
};

export function experienceReducer(state, action) {
  switch (action.type) {
    case 'ENTER':
      return state.phase === 'entering' ? { ...state, phase: 'ready' } : state;
    case 'PRESS_CORRECT':
      if (state.phase !== 'ready') return state;
      return {
        ...state,
        step: state.step + 1,
        pressed: [...state.pressed, action.midi],
        mistakeMidi: null,
      };
    case 'PRESS_WRONG':
      return state.phase === 'ready'
        ? { ...state, mistakeMidi: action.midi }
        : state;
    case 'CLEAR_MISTAKE':
      return { ...state, mistakeMidi: null };
    case 'PLAY':
      return { ...state, phase: 'playing', mistakeMidi: null };
    case 'PAUSE':
      return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'RESUME':
      return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
    case 'END':
      return { ...state, phase: 'ended' };
    case 'RESTART_SONG':
      return { ...state, phase: 'playing' };
    case 'SEEK':
      return state.phase === 'ended' ? { ...state, phase: 'paused' } : state;
    case 'RESET':
      return { ...initialExperience, phase: 'ready' };
    default:
      return state;
  }
}
