import assert from "node:assert/strict";
import test from "node:test";
import React, { useRef } from "react";
import { act, create } from "react-test-renderer";

import { useIntersection } from "./use-intersection";
import { useScrollPosition } from "./use-scroll-position";
import { useWindowResize } from "./use-window-resize";

type Listener = { handler: EventListener; options?: AddEventListenerOptions };

class MockEventTarget {
  private listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, handler: EventListener, options?: AddEventListenerOptions) {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add({ handler, options });
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, handler: EventListener) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const entry of set) {
      if (entry.handler === handler) {
        set.delete(entry);
      }
    }
    if (set.size === 0) this.listeners.delete(type);
  }

  dispatch(type: string, event: Event) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const entry of set) {
      entry.handler(event);
    }
  }

  count(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }
}

class MockIntersectionObserver {
  static lastInstance: MockIntersectionObserver | undefined;

  public observed: Element[] = [];
  public disconnectCalls = 0;

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.lastInstance = this;
  }

  observe = (element: Element) => {
    this.observed.push(element);
  };

  disconnect = () => {
    this.disconnectCalls += 1;
  };

  trigger(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

test("useWindowResize снимает подписку на unmount", async () => {
  const target = new MockEventTarget();
  let calls = 0;

  function Component() {
    useWindowResize(() => {
      calls += 1;
    }, { target });
    return null;
  }

  let renderer: ReturnType<typeof create> | null = null;
  await act(() => {
    renderer = create(React.createElement(Component));
  });

  assert.equal(target.count("resize"), 1);

  target.dispatch("resize", new Event("resize"));
  assert.equal(calls, 1);

  await act(() => {
    renderer?.unmount();
  });

  assert.equal(target.count("resize"), 0);
});

test("useScrollPosition вызывает callback сразу и чистит слушатель", async () => {
  const target = new MockEventTarget();
  let calls = 0;

  function Component() {
    useScrollPosition(() => {
      calls += 1;
    }, { target });
    return null;
  }

  let renderer: ReturnType<typeof create> | null = null;
  await act(() => {
    renderer = create(React.createElement(Component));
  });

  assert.equal(calls, 1);
  assert.equal(target.count("scroll"), 1);

  target.dispatch("scroll", new Event("scroll"));
  assert.equal(calls, 2);

  await act(() => {
    renderer?.unmount();
  });

  assert.equal(target.count("scroll"), 0);
});

test("useIntersection подписывается и отключается при размонтировании", async () => {
  const element = {} as Element;
  let intersected = false;

  function Component() {
    const ref = useRef<Element | null>(element);
    useIntersection(
      ref,
      (entry) => {
        intersected = entry.isIntersecting;
      },
      { Observer: MockIntersectionObserver as unknown as typeof IntersectionObserver },
    );
    return null;
  }

  let renderer: ReturnType<typeof create> | null = null;
  await act(() => {
    renderer = create(React.createElement(Component));
  });

  const instance = MockIntersectionObserver.lastInstance;
  assert.ok(instance);
  assert.deepEqual(instance?.observed, [element]);

  instance?.trigger([{ isIntersecting: true } as IntersectionObserverEntry]);
  assert.equal(intersected, true);

  await act(() => {
    renderer?.unmount();
  });

  assert.equal(instance?.disconnectCalls, 1);
});
