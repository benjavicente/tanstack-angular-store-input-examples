import {
  Component,
  Signal,
  signal,
  DestroyRef,
  inject,
  effect,
  model,
} from "@angular/core";
import { TimeInputComponent } from "@app/components/time-input.component";
import { createStableSignal, injectLazyStore } from "@app/lib/injectLazyStore";

import { RelativeTime } from "@app/lib/RelativeTimeStore";

export function injectRelativeTimestamp(timestamp: Signal<number>) {
  // Defer the creation of the store until the first read happens,
  // usually it's the first effect that depends on the signal.
  const relativeTimestamp = createStableSignal(
    () => new RelativeTime(timestamp()),
  );

  // Attach to the specific store lifecycle
  effect(() => {
    relativeTimestamp().updateTimestamp(timestamp());
  });
  inject(DestroyRef).onDestroy(() => relativeTimestamp().destroy());

  // Subscribe to the store
  return injectLazyStore(() => relativeTimestamp().store);
}

@Component({
  selector: "app-signals-are-lazy-child",
  standalone: true,
  imports: [TimeInputComponent],
  template: `
    <div class="flex flex-row gap-2 items-center">
      <app-time-input [(timestamp)]="timestamp" />
      <div>
        {{ timestamp() }}
      </div>
      <div>
        {{ relative() }}
      </div>
    </div>
  `,
})
export class SignalsAreLazyChildComponent {
  public readonly timestamp = model.required<number>();
  protected readonly relative = injectRelativeTimestamp(this.timestamp);

  constructor() {
    // Can't read signals derived from required inputs/models before initialization
    // so uncommenting this will throw the NG0950 error
    // this.relative();
  }
}

@Component({
  standalone: true,
  imports: [SignalsAreLazyChildComponent],
  template: `
    @defer (on immediate) {
      <app-signals-are-lazy-child [timestamp]="timestamp()" />
    }
    <p class="mt-4">
      Signals come to the rescue since they are lazy. We can defer store
      creation inside a signal; the first read happens in an effect or the
      template, after the required input is set. Users see the same NG0950
      error if they read that signal before initialization (e.g. in the
      constructor), as with reading required inputs directly.
    </p>
  `,
})
export class SignalsAreLazyPage {
  protected readonly timestamp = signal(Date.now());
}
