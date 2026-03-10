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
  // Create and set state
  // @ts-expect-error - Problem in this aproach:
  // The store wants to start with an initial value (like with all adapters),
  // but we can't call timestamp here since it's an input signal.
  const relativeTimestamp = new RelativeTime();

  // Attach to the specific store lifecycle
  effect(() => {
    relativeTimestamp.updateTimestamp(timestamp());
  });
  inject(DestroyRef).onDestroy(() => relativeTimestamp.destroy());

  // Subscribe to the store *immediately*
  return injectStore(relativeTimestamp.store);
}

@Component({
  selector: "app-not-great-effects-child",
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
export class NotGreatEffectsChildComponent {
  public readonly timestamp = model.required<number>();

  protected readonly before = effect(() => {
    if (this.relative() === null) {
      // Sanity check, it might break if the store is subscribed in an effect
      window.alert("before is null!");
    }
  });

  protected readonly relative = injectRelativeTimestamp(this.timestamp);
}

@Component({
  standalone: true,
  imports: [NotGreatEffectsChildComponent],
  template: `
    @defer (on immediate) {
      <app-not-great-effects-child [timestamp]="timestamp()" />
    }
    <p class="mt-4">
      Effect and other lifecycle methods can be used to try to manage the state
      of the store.
    </p>
    <p>
      But effects are a syncing mechanism! At some moment, the store runs with
      an invalid value, and since the ordering of the effects matters, if we
      define an effect before the store is created, we will see that the state
      is not yet initialized.
    </p>
  `,
})
export class NotGreatEffectsPage {
  protected readonly timestamp = signal(Date.now());
}
