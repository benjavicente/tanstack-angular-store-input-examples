import {
  Component,
  Signal,
  signal,
  DestroyRef,
  inject,
  effect,
} from "@angular/core";
import { TimeInputComponent } from "@app/components/time-input.component";
import { injectStore } from "@app/lib/injectStore";
import { RelativeTime } from "@app/lib/RelativeTimeStore";

export function injectRelativeTimestamp(timestamp: Signal<number>) {
  const relativeTimestamp = new RelativeTime(timestamp());

  // Attach to the specific store lifecycle
  effect(() => {
    relativeTimestamp.updateTimestamp(timestamp());
  });
  inject(DestroyRef).onDestroy(() => relativeTimestamp.destroy());

  // Subscribe to the store
  return injectStore(relativeTimestamp.store);
}

@Component({
  standalone: true,
  imports: [TimeInputComponent],
  template: `
    @defer (on immediate) {
      <div class="flex flex-row gap-2 items-center">
        <app-time-input [(timestamp)]="timestamp" />
        <div>
          {{ timestamp() }}
        </div>
        <div>
          {{ relative() }}
        </div>
      </div>
    }
    <p class="mt-4">
      Normal signals always have a value, so the injectRelativeTimestamp
      function can read them without problems.
    </p>
  `,
})
export class NormalSignalsPage {
  protected readonly timestamp = signal(Date.now());
  protected readonly relative = injectRelativeTimestamp(this.timestamp);
}
