import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import {
  LucideBookOpen,
  LucideChartColumn,
  LucideDynamicIcon,
  LucideHouse,
  LucideIcon,
  LucideRotateCcw,
  LucideSlidersHorizontal,
} from '@lucide/angular';
import { filter, map } from 'rxjs';
import { ReviewQueueService } from '../../core/review-queue.service';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Outros caminhos que também deixam o item ativo (o editor pertence a Matérias). */
  alsoActiveOn?: string[];
  showsQueue?: boolean;
}

/** Barra lateral fixa de 232px (design §4). */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, NgTemplateOutlet, LucideDynamicIcon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly router = inject(Router);
  protected readonly queue = inject(ReviewQueueService);

  protected readonly mainItems: NavItem[] = [
    { label: 'Início', path: '/', icon: LucideHouse },
    { label: 'Matérias', path: '/materias', icon: LucideBookOpen, alsoActiveOn: ['/resumos'] },
    { label: 'Revisão', path: '/revisao', icon: LucideRotateCcw, showsQueue: true },
    { label: 'Estatísticas', path: '/estatisticas', icon: LucideChartColumn },
  ];
  protected readonly settingsItem: NavItem = {
    label: 'Configurações',
    path: '/configuracoes',
    icon: LucideSlidersHorizontal,
  };

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected isActive(item: NavItem): boolean {
    const path = this.url().split(/[?#]/)[0];
    if (item.path === '/') return path === '/';
    return [item.path, ...(item.alsoActiveOn ?? [])].some(
      (p) => path === p || path.startsWith(p + '/'),
    );
  }
}
