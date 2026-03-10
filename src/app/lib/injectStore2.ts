import {
  DestroyRef,
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
 * Injects a store or a signal that contains a store.
 * 
 * @param storeOrStoreSignal - A store or a stable signal that contains a store.
 * @param selector - A selector function that will be used to select the state from the store.
 * @param options - Options for the signal.
 */
export function injectLazyStore<TState, TSelected = NoInfer<TState>>(
  storeOrStoreSignal: Atom<TState> | ReadonlyAtom<TState> | (() => Atom<TState> | ReadonlyAtom<TState>),
  selector?: (state: NoInfer<TState>) => TSelected,
  options?: CreateSignalOptions<TSelected> & { injector?: Injector },
): Signal<TSelected>
export function injectLazyStore<
  TState extends StoreContext,
  TSelected = NoInfer<TState>,
>(
  storeOrStoreSignal: Atom<TState> | ReadonlyAtom<TState> | (() => Atom<TState> | ReadonlyAtom<TState>),
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
    if (typeof storeOrStoreSignal === 'function') {
      const slice = linkedSignal(() => selector(storeOrStoreSignal().get()), options)

      effect((onCleanup) => {
        const { unsubscribe } = storeOrStoreSignal().subscribe((s) => {
          slice.set(selector(s))
        })
        onCleanup(() => unsubscribe())
      })

      return slice.asReadonly()
    } else {
      const destroyRef = inject(DestroyRef)
      const slice = linkedSignal(() => selector(storeOrStoreSignal.get()), options)
      // Subscribe immediately, so any effect will have the value immediately.
      const { unsubscribe } = storeOrStoreSignal.subscribe((s) => {
        slice.set(selector(s))
      })

      destroyRef.onDestroy(() => {
        unsubscribe()
      })

      return slice.asReadonly()
    }
  })
}
