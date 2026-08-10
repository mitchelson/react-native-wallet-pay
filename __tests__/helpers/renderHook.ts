import React from 'react';
import renderer, { act } from 'react-test-renderer';

type HookResult<T> = { current: T };

/**
 * Minimal hook harness — avoids pulling the full RN Testing Library / RN preset.
 */
export function renderHook<T>(callback: () => T): {
  result: HookResult<T>;
  rerender: () => void;
} {
  const result: HookResult<T> = { current: undefined as unknown as T };

  function TestComponent() {
    result.current = callback();
    return null;
  }

  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(React.createElement(TestComponent));
  });

  return {
    result,
    rerender: () => {
      act(() => {
        tree.update(React.createElement(TestComponent));
      });
    },
  };
}

export { act };
