import { Component, model } from '@angular/core';

@Component({
  selector: 'app-time-input',
  standalone: true,
  template: `
    <input
      type="datetime-local"
      [value]="datetimeLocalValue()"
      (input)="onInput($event)"
      class="rounded border border-slate-300 px-3 py-2 text-sm"
    />
  `,
})
export class TimeInputComponent {
  readonly timestamp = model<number>(Date.now());

  /** String value for datetime-local input (YYYY-MM-DDTHH:mm). */
  protected readonly datetimeLocalValue = () => {
    const ms = this.timestamp();
    const d = new Date(ms);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = d.getFullYear();
    const M = pad(d.getMonth() + 1);
    const D = pad(d.getDate());
    const h = pad(d.getHours());
    const m = pad(d.getMinutes());
    return `${y}-${M}-${D}T${h}:${m}`;
  };

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!value) return;
    const ms = new Date(value).getTime();
    if (!Number.isNaN(ms)) {
      this.timestamp.set(ms);
    }
  }
}
