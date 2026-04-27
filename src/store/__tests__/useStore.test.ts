import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from '../useStore';
import { Intervention } from '@/types';

// The store uses Firebase, but src/tests/setup.tsx already mocks it globally.

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state if needed (Zustand doesn't have a built-in reset for the whole store easily without custom implementation)
    // For these tests, we will just interact with it.
  });

  it('should add a notification correctly', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.addNotification({
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test'
      });
    });

    expect(result.current.notifications[0].title).toBe('Test Notification');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('should mark notifications as read', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.markNotificationsAsRead();
    });

    result.current.notifications.forEach(n => {
      expect(n.read).toBe(true);
    });
  });

  it('should update an intervention locally', () => {
    const { result } = renderHook(() => useStore());
    
    const mockInt: Intervention = {
      id: 'test-int-1',
      address: '123 Test St',
      status: 'pending',
      tech_id: 'tech-1',
      date: '2026-02-09',
      time: '10:00',
      description: 'Test',
      latitude: 48.5,
      longitude: 7.7,
      category: 'repair',
      client_id: 'c1'
    };

    act(() => {
      // Manually add to state for testing update logic
      // Note: In real app, this comes from Firestore listener
      useStore.setState({ interventions: [mockInt] });
    });

    act(() => {
      result.current.updateIntervention('test-int-1', { status: 'done' });
    });

    const updated = result.current.interventions.find(i => i.id === 'test-int-1');
    expect(updated?.status).toBe('done');
  });

  it('should decrement inventory stock', () => {
    const { result } = renderHook(() => useStore());
    
    act(() => {
      result.current.decrementStock('i1', 5);
    });

    const item = result.current.inventory.find(i => i.id === 'i1');
    // Default quantity for i1 is 24 in DUMMY_INVENTORY
    expect(item?.quantity).toBe(19);
  });
});
