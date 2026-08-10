import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('adds a toast with unique incrementing ID', () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.add('Test message', 'success'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');

    act(() => result.current.add('Another message', 'error'));
    expect(result.current.toasts).toHaveLength(2);
    // IDs should be different (incrementing, not Date.now())
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  it('removes toast by ID', () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.add('Message 1', 'info'));
    act(() => result.current.add('Message 2', 'warning'));
    const idToRemove = result.current.toasts[0].id;

    act(() => result.current.remove(idToRemove));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Message 2');
  });

  it('auto-removes toast after duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.add('Auto remove', 'success'));
    expect(result.current.toasts).toHaveLength(1);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.toasts).toHaveLength(0);
  });
});
