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

import { injectStore } from "@app/lib/injectStore";
import { RelativeTime } from "@app/lib/RelativeTimeStore";

export function injectRelativeTimestamp(timestamp: Signal<number>) {
  // The next like throws NG0950 since the timestamp reads an input
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
  selector: "app-breaks-with-inputs-child",
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
export class BreaksWithInputsChildComponent {
  public readonly timestamp = model.required<number>();
  protected readonly relative = injectRelativeTimestamp(this.timestamp);
}

@Component({
  standalone: true,
  imports: [BreaksWithInputsChildComponent],
  template: `
    @defer (on immediate) {
      <app-breaks-with-inputs-child [timestamp]="timestamp()" />
    }
    <p class="mt-4">But required input and models signals do not!</p>
    <pre>
NG0950: Model/Input "timestamp" is required but no value is available yet.</pre
    >
    <p>
      We want to display a value immediately, maybe for SRR, to avoid potential
      flickering or for avoiding potential timing issues.
    </p>
  `,
})
export class BreaksWithInputsPage {
  protected readonly timestamp = signal(Date.now());
}
