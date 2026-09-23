import type { SessionStatus } from "./session-status.js";

type Timer = ReturnType<typeof setInterval>;

export interface WatchSessionStatusOptions {
  readStatus: () => SessionStatus | null;
  render: (status: SessionStatus | null) => void;
  registerInterrupt: (listener: () => void) => () => void;
  onStop: () => void;
  onError: (error: unknown) => void;
  setInterval: (callback: () => void, milliseconds: number) => Timer;
  clearInterval: (timer: Timer) => void;
}

export function watchSessionStatus(
  options: WatchSessionStatusOptions,
): () => void {
  let stopped = false;
  let timer: Timer | undefined;
  let unregisterInterrupt = (): void => {};

  const stop = (): void => {
    if (stopped) {
      return;
    }

    stopped = true;

    if (timer !== undefined) {
      options.clearInterval(timer);
    }

    unregisterInterrupt();
    options.onStop();
  };

  const update = (): boolean => {
    try {
      const status = options.readStatus();
      options.render(status);

      if (status === null) {
        stop();
        return false;
      }

      return true;
    } catch (error) {
      options.onError(error);
      stop();
      return false;
    }
  };

  unregisterInterrupt = options.registerInterrupt(stop);

  if (update()) {
    timer = options.setInterval(() => {
      update();
    }, 1_000);
  }

  return stop;
}
