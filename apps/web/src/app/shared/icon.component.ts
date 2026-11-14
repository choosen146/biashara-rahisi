import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Stroke icons on a 24px grid (Lucide-style geometry). */
const ICONS = {
  overview: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  sales: [
    'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
    'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8', 'M12 17.5v-11',
  ],
  purchases: [
    'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', 'M15 18H9',
    'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14', circle(17, 18, 2), circle(7, 18, 2),
  ],
  inventory: [
    'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
    'M12 22V12', 'M3.3 7 12 12l8.7-5',
  ],
  products: ['M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z', circle(7.5, 7.5, 1)],
  customers: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  suppliers: [
    'M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5', 'M4 10.8V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.2',
    'M2 7l2.6-3.6A1 1 0 0 1 5.4 3h13.2a1 1 0 0 1 .8.4L22 7z', 'M2 7c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3 0 1.7 1.3 3 3 3s3-1.3 3-3',
  ],
  expenses: [
    'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
    'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  ],
  reports: ['M21 12c.55 0 1-.45.95-1A10 10 0 0 0 13 2.05c-.55-.05-1 .4-1 .95v8a1 1 0 0 0 1 1z', 'M21.21 15.89A10 10 0 1 1 8 2.83'],
  team: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'M9 12l2 2 4-4'],
  audit: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  settings: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    circle(12, 12, 3),
  ],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  search: [circle(11, 11, 8), 'M21 21l-4.3-4.3'],
  edit: ['M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z', 'M15 5l4 4'],
  ban: [circle(12, 12, 10), 'M4.9 4.9l14.2 14.2'],
  more: [circle(12, 12, 1), circle(19, 12, 1), circle(5, 12, 1)],
  up: ['M22 7 13.5 15.5 8.5 10.5 2 17', 'M16 7h6v6'],
  down: ['M22 17 13.5 8.5 8.5 13.5 2 7', 'M16 17h6v-6'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  sun: [circle(12, 12, 4), 'M12 2v2', 'M12 20v2', 'M4.93 4.93l1.41 1.41', 'M17.66 17.66l1.41 1.41', 'M2 12h2', 'M20 12h2', 'M6.34 17.66l-1.41 1.41', 'M19.07 4.93l-1.41 1.41'],
  globe: [circle(12, 12, 10), 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  chevron: ['M9 18l6-6-6-6'],
  chevronDown: ['M6 9l6 6 6-6'],
  arrowLeft: ['M19 12H5', 'M12 19l-7-7 7-7'],
  check: ['M20 6 9 17l-5-5'],
  alert: [circle(12, 12, 10), 'M12 8v4', 'M12 16h.01'],
  info: [circle(12, 12, 10), 'M12 16v-4', 'M12 8h.01'],
  refresh: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
  table: ['M3 3h18v18H3z', 'M3 9h18', 'M3 15h18', 'M12 3v18'],
  chart: ['M3 3v18h18', 'M8 17V10', 'M13 17V6', 'M18 17v-4'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M19 8v6', 'M22 11h-6'],
  printer: ['M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6', 'M6 14h12v8H6z'],
  swap: ['M7 16V4', 'M3 8l4-4 4 4', 'M17 8v12', 'M21 16l-4 4-4-4'],
  cash: ['M2 6h20v12H2z', circle(12, 12, 2), 'M6 12h.01', 'M18 12h.01'],
  lock: ['M5 11h14v11H5z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  building: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'tbms-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'icon' },
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round">
    @for (d of paths(); track $index) { <path [attr.d]="d" /> }
  </svg>`,
  styles: [':host{display:inline-flex;flex:none;line-height:0}'],
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(20);
  stroke = input(1.8);
  paths = computed(() => ICONS[this.name()]);
}
