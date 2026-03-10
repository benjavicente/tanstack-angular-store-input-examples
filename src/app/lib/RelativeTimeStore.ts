import { Store } from '@tanstack/store';

/**
 * Agnostic store to manage the relative time.
 */
export class RelativeTime {
  public readonly store: Store<string>;

  private timestamp: number;
  private readonly timerId: number;

  constructor(timestamp: number) {
    this.timestamp = timestamp;
    this.store = new Store(this.formatRelativeTime());
    this.timerId = window.setInterval(() => {
      this.store.setState(() => this.formatRelativeTime());
    }, 1000);
  }

  public updateTimestamp(timestamp: number) {
    this.timestamp = timestamp;
    this.store.setState(() => this.formatRelativeTime());
  }

  public destroy() {
    window.clearInterval(this.timerId);
  }

  private formatRelativeTime(now = Date.now()) {
    if (typeof this.timestamp !== 'number') {
      console.error("'Expensive' formatRelativeTime called with invalid value!");
      return "invalid"
    }

    const diffInSeconds = Math.floor((now - this.timestamp) / 1000);
    const isPast = diffInSeconds >= 0;
    const absSeconds = Math.abs(diffInSeconds);

    if (absSeconds < 1) {
      return 'just now';
    }

    const suffix = isPast ? ' ago' : '';
    const prefix = isPast ? '' : 'in ';

    if (absSeconds < 60) {
      return `${prefix}${absSeconds}s${suffix}`;
    }

    const absMinutes = Math.floor(absSeconds / 60);

    if (absMinutes < 60) {
      return `${prefix}${absMinutes}m${suffix}`;
    }

    const absHours = Math.floor(absMinutes / 60);

    if (absHours < 24) {
      return `${prefix}${absHours}h${suffix}`;
    }

    const absDays = Math.floor(absHours / 24);
    return `${prefix}${absDays}d${suffix}`;
  }
}
