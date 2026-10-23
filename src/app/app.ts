import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './layout/confirm-dialog/confirm-dialog';
import { Sidebar } from './layout/sidebar/sidebar';
import { Toast } from './layout/toast/toast';

/** Layout base: barra lateral + área principal com rolagem própria (design §4, §5). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Toast, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
