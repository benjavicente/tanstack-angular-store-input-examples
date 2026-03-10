# Angular Store example

The issue that the Angular Store adapter can't be initialized with a value coming from an input or model signal.

```ts
export function injectRelativeTimestamp(timestamp: Signal<number>) {
  // Throws NG0950: no model/input available yet
  const relativeTimestamp = new RelativeTime(timestamp());
}

@Component( ... )
export class BreaksWithInputsChildComponent {
  public readonly timestamp = model.required<number>();
  protected readonly relative = injectRelativeTimestamp(this.timestamp);
}
```

Angular has 3 stages that matter for this problem:

1. Constructor
2. Initialization (`ngOnInit`)
3. Effects and renders

The code above runs at 1. Inputs are available only after 2.

---

To attempt to fix this, we could use effects like this:

```ts
export function injectRelativeTimestamp(timestamp: Signal<number>) {
  // @ts-expect-error - Ignoring that it can have an initial value
  const relativeTimestamp = new RelativeTime();

  // This effect initializes the store with a value
  effect(() => {
    relativeTimestamp.updateTimestamp(timestamp());
  });
  inject(DestroyRef).onDestroy(() => relativeTimestamp.destroy());

  // Subscribe
  return injectStore(relativeTimestamp.store);
}
```

or with something like:

```ts
export function injectRelativeTimestamp(timestamp: Signal<number>) {
  let relativeTimestamp: RelativeTime;
  effect(() => {
    relativeTimestamp = new RelativeTime(untracked(timestamp));
  });

  // Attach to the specific store lifecycle
  effect(() => {
    relativeTimestamp.updateTimestamp(timestamp());
  });
  inject(DestroyRef).onDestroy(() => relativeTimestamp.destroy());

  // Subscribe
  const representation = signal<string>(null as unknown as string);
  effect(() => {
    relativeTimestamp.store.subscribe((state) => {
      representation.set(state);
    });
  });
  return representation;
}
```

But this has problems.
Effects are a syncing mechanism, and using them like this is not ideal.
At runtime, the `relativeTimestamp` store will be initialized when the first effect of those snippets gets executed.
So if for some reason, an effect that runs earlier reads the value of injectRelativeTimestamp, it may get an uninitialized value.

```ts
// Valid Angular code
const before = effect(() => {
  if (typeof this.relative() !== "string") {
    window.alert("relative is in an invalid state!");
  }
});

const relative = injectRelativeTimestamp(this.timestamp);
```

The ideal solution should have everything setup in 2 initialization, and not in 3 effects.

---

A solution to this problem is to use the lazy initialization properties of computed and linked signals.
We can define a store inside a computed, and the construction of the store will only run in the first read, which should be in the component effects.

```ts
const relativeTimestamp = createStableSignal(
  () => new RelativeTime(timestamp()),
);

effect(() => {
  // Initialized here or in a previous effect
  relativeTimestamp().updateTimestamp(timestamp());
});
inject(DestroyRef).onDestroy(() => relativeTimestamp().destroy());

// Subscribe to the store
return injectLazyStore(() => relativeTimestamp().store);
```

Where `injectLazyStore` does this:

```ts
// Lazy read the initial state of the store
function injectLazyStore(storeSignal) {
  const slice = linkedSignal(() => selector(storeSignal().get()), options);

  effect((onCleanup) => {
    const { unsubscribe } = storeSignal().subscribe((s) => {
      slice.set(selector(s));
    });
    onCleanup(() => unsubscribe());
  });

  return slice.asReadonly();
}
```

And `createStableSignal` is just a helper to create a stable value that will be lazy evaluated.

```ts
export function createStableSignal<T>(fn: () => T): () => T {
  return computed(() => untracked(fn));
}
```

---

This is different from Vue, Solid and Svelte, where signals always have a value.

But the idea is really similar to the one in React.

```ts
// Does the same as injectLazyStore
export function useStore(store) {
  const subscribe = useCallback(
    (handleStoreChange) => {
      const { unsubscribe } = store.subscribe(handleStoreChange);
      return unsubscribe;
    },
    [store],
  );

  const snapshot = useCallback(() => store?.get(), [store]);
  return useSyncExternalStore(subscribe, snapshot);
}

function useQuery() {
  // Does the same as createStableSignal
  const [observer] = React.useState(
    () => new Observer(queryClient, defaultedQueryOptions),
  );

  return useStore(observer.store);
}
```

While it isn't ideal to accept that the store can change,
we can assume that consumers are smart enough to update the store value
instead of re-creating the store per update/render.

---

Even though the solution works for input signals, we end up with a design problem:
Our previous API accepted only stores, and now we are accepting stores and functions that return stores.

```ts
export function injectLazyStore(storeOrStoreSignal, selector) {
  const storeSignal =
    typeof storeOrStoreSignal === "function"
      ? storeOrStoreSignal
      : () => storeOrStoreSignal;

  const slice = linkedSignal(() => selector(storeSignal().get()), options);

  effect((onCleanup) => {
    const { unsubscribe } = storeOrStoreSignal().subscribe((s) => {
      slice.set(selector(s));
    });
    onCleanup(() => unsubscribe());
  });

  return slice.asReadonly();
}
```

We would need to check if moving the subscription to an effect would cause a timing issue. The other solution would be to split it in two:

```ts
export function injectLazyStore(storeOrStoreSignal, selector) {
  if (typeof storeOrStoreSignal === "function") {
    const slice = linkedSignal(
      () => selector(storeOrStoreSignal().get()),
      options,
    );

    effect((onCleanup) => {
      const { unsubscribe } = storeOrStoreSignal().subscribe((s) => {
        slice.set(selector(s));
      });
      onCleanup(() => unsubscribe());
    });

    return slice.asReadonly();
  } else {
    const destroyRef = inject(DestroyRef);
    const slice = linkedSignal(
      () => selector(storeOrStoreSignal.get()),
      options,
    );
    const { unsubscribe } = storeOrStoreSignal.subscribe((s) => {
      slice.set(selector(s));
    });

    destroyRef.onDestroy(() => {
      unsubscribe();
    });

    return slice.asReadonly();
  }
}
```
