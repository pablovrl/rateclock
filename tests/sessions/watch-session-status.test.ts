import { describe, expect, it, vi } from "vitest";

import type { SessionStatus } from "../../src/sessions/session-status.js";
import { watchSessionStatus } from "../../src/sessions/watch-session-status.js";

const activeStatus = {} as SessionStatus;

describe("watchSessionStatus", () => {
  it("updates immediately and every second, then cleans up on empty status", () => {
    const statuses = [activeStatus, activeStatus, null];
    const render = vi.fn();
    const clearTimer = vi.fn();
    const unregisterInterrupt = vi.fn();
    const onStop = vi.fn();
    let intervalCallback = (): void => {};
    let interruptListener = (): void => {};

    watchSessionStatus({
      readStatus: () => statuses.shift() ?? null,
      render,
      registerInterrupt: (listener) => {
        interruptListener = listener;
        return unregisterInterrupt;
      },
      onStop,
      onError: vi.fn(),
      setInterval: (callback, milliseconds) => {
        expect(milliseconds).toBe(1_000);
        intervalCallback = callback;
        return 1 as unknown as ReturnType<typeof setInterval>;
      },
      clearInterval: clearTimer,
    });

    expect(render).toHaveBeenCalledTimes(1);
    intervalCallback();
    intervalCallback();

    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(null);
    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(unregisterInterrupt).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);

    interruptListener();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("cleans up when interrupted", () => {
    const clearTimer = vi.fn();
    const unregisterInterrupt = vi.fn();
    const onStop = vi.fn();
    let interruptListener = (): void => {};

    watchSessionStatus({
      readStatus: () => activeStatus,
      render: vi.fn(),
      registerInterrupt: (listener) => {
        interruptListener = listener;
        return unregisterInterrupt;
      },
      onStop,
      onError: vi.fn(),
      setInterval: () => 1 as unknown as ReturnType<typeof setInterval>,
      clearInterval: clearTimer,
    });

    interruptListener();

    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(unregisterInterrupt).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
