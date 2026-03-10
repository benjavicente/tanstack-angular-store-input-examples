import {
  Injector,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  linkedSignal,
  runInInjectionContext,
  untracked,
} from '@angular/core'
import { shallow } from './shallow'
import type { Atom, ReadonlyAtom } from '@tanstack/store'
import type { CreateSignalOptions, Signal } from '@angular/core'

type StoreContext = Record<string, unknown>

/**
 * Creates a stable signal that does not update when the input signal updates.
 * Useful to lazily initialize objects that depend on signals.
 * 
 * @param fn - A function that will be used to initialize the stable signal.
 * @returns A stable signal that does not update when the input signal updates.
 */
export function createStableSignal<T>(fn: () => T): () => T {
  return computed(() => untracked(fn))
}

/**
 * Subscribes to a store passed as a signal. If the signal changes, this will subscribe to the new store.
 * It works similarly to the React implementation instead of the Solid/Vue/Svelte one.
 * 
 * @param storeSignal - A signal that will be used to initialize the store. The signal should not update.
 * @param selector - A selector function that will be used to select the state from the store.
 * @param options - Options for the signal.
 */
export function injectLazyStore<TState, TSelected = NoInfer<TState>>(
  storeSignal: () => Atom<TState> | ReadonlyAtom<TState>,
  selector?: (state: NoInfer<TState>) => TSelected,
  options?: CreateSignalOptions<TSelected> & { injector?: Injector },
): Signal<TSelected>
export function injectLazyStore<
  TState extends StoreContext,
  TSelected = NoInfer<TState>,
>(
  storeSignal: () => Atom<TState> | ReadonlyAtom<TState>,
  selector: (state: NoInfer<TState>) => TSelected = (d) =>
    d as unknown as TSelected,
  options: CreateSignalOptions<TSelected> & { injector?: Injector } = {
    equal: shallow,
  },
): Signal<TSelected> {
  !options.injector && assertInInjectionContext(injectLazyStore)

  if (!options.injector) {
    options.injector = inject(Injector)
  }

  return runInInjectionContext(options.injector, () => {
    const slice = linkedSignal(() => selector(storeSignal().get()), options)

    effect((onCleanup) => {
      const { unsubscribe } = storeSignal().subscribe((s) => {
        slice.set(selector(s))
      })
      onCleanup(() => unsubscribe())
    })

    return slice.asReadonly()
  })
}
