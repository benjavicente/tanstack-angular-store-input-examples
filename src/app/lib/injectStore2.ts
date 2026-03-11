import {
  Injector,
  assertInInjectionContext,
  effect,
  inject,
  linkedSignal,
  runInInjectionContext,
} from "@angular/core";
import { shallow } from "./shallow";
import type { Atom, ReadonlyAtom } from "@tanstack/store";
import type { CreateSignalOptions, Signal } from "@angular/core";

/**
 * Injects a store or a signal that contains a store.
 *
 * @param storeOrStoreSignal - A store or a function that returns a store.
 * @param selector - A selector function that will be used to select the state from the store.
 * @param options - Options for the signal.
 */
export function injectStore<TState, TSelected = NoInfer<TState>>(
  storeOrStoreSignal:
    | Atom<TState>
    | ReadonlyAtom<TState>
    | (() => Atom<TState> | ReadonlyAtom<TState>),
  selector?: (state: NoInfer<TState>) => TSelected,
  options?: CreateSignalOptions<TSelected> & { injector?: Injector },
): Signal<TSelected>;
export function injectStore<TState, TSelected = NoInfer<TState>>(
  storeOrStoreSignal:
    | Atom<TState>
    | ReadonlyAtom<TState>
    | (() => Atom<TState> | ReadonlyAtom<TState>),
  selector: (state: NoInfer<TState>) => TSelected = (d) =>
    d as unknown as TSelected,
  options: CreateSignalOptions<TSelected> & { injector?: Injector } = {
    equal: shallow,
  },
): Signal<TSelected> {
  !options.injector && assertInInjectionContext(injectStore);

  if (!options.injector) {
    options.injector = inject(Injector);
  }

  return runInInjectionContext(options.injector, () => {
    const storeSignal =
      typeof storeOrStoreSignal === "function"
        ? storeOrStoreSignal
        : () => storeOrStoreSignal;

    const slice = linkedSignal(() => selector(storeSignal().get()), options);

    effect((onCleanup) => {
      const { unsubscribe } = storeSignal().subscribe((s) => {
        slice.set(selector(s));
      });
      onCleanup(() => unsubscribe());
    });

    return slice.asReadonly();
  });
}
