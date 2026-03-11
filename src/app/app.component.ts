import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

export const links = [
  {
    path: "/1-normal-signals",
    label: "Normal signals",
  },
  {
    path: "/2-breaks-with-inputs",
    label: "Breaks with inputs",
  },
  {
    path: "/3-not-great-effects",
    label: "Not great effects",
  },
  {
    path: "/4-signals-are-lazy",
    label: "Signals are lazy",
  }
];

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="p-4 flex flex-col gap-4">
      <h1 class="text-2xl font-bold">Angular Store Examples</h1>
      <p>
        Some cases with Angular Store patterns and how they interact with input
        signals.
      </p>
      <p>
        For the context of all examples, assume that creating a store is
        expensive. For example, it might invoke a network request. In here we
        are doing a simple timer.
      </p>
      <nav class="flex gap-2">
        @for (link of links; track link.path) {
          <a
            [routerLink]="link.path"
            class="text-blue-500"
            routerLinkActive="text-black!"
            >{{ link.label }}</a
          >
        }
      </nav>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  protected readonly links = links;
}
