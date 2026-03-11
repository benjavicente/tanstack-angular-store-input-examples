import { JsonPipe } from "@angular/common";
import {
  Component,
  Signal,
  signal,
  DestroyRef,
  inject,
  effect,
  OnInit,
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
  imports: [TimeInputComponent, JsonPipe],
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
        <div>ngOnInit relative: {{ relativeNgOnInit | json }}</div>
      </div>
    }
    <p class="mt-4">
      Normal signals always have a value, so the injectRelativeTimestamp
      function can read them without problems.
    </p>
  `,
})
export class NormalSignalsPage implements OnInit {
  protected readonly timestamp = signal(Date.now());
  protected readonly relative = injectRelativeTimestamp(this.timestamp);
  protected relativeNgOnInit!: string;

  ngOnInit() {
    console.log("timestamp input on ngOnInit", this.timestamp());
    console.log(
      "relative, calculated from timestamp, on ngOnInit",
      this.relative(),
    );
    this.relativeNgOnInit = this.relative();
  }
}
