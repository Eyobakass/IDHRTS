/**
 * @jest-environment node
 */
import { useAuthStore } from '../authStore';

describe('authStore - Node Environment', () => {
  it('initializes correctly when window is undefined', () => {
    expect(typeof window).toBe('undefined');
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.role).toBeNull();
  });
});
