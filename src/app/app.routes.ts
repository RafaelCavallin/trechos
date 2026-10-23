import { Routes } from '@angular/router';

/** Rotas do design §4. O editor (/resumos/:id) é uma subtela de Matérias. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Início · Trechos',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'materias',
    title: 'Matérias · Trechos',
    loadComponent: () => import('./pages/subjects/subjects').then((m) => m.Subjects),
  },
  {
    path: 'resumos/:id',
    title: 'Resumo · Trechos',
    loadComponent: () =>
      import('./pages/summary-editor/summary-editor').then((m) => m.SummaryEditor),
  },
  {
    path: 'revisao',
    title: 'Revisão · Trechos',
    loadComponent: () => import('./pages/review/review').then((m) => m.Review),
  },
  {
    path: 'estatisticas',
    title: 'Estatísticas · Trechos',
    loadComponent: () => import('./pages/stats/stats').then((m) => m.Stats),
  },
  {
    path: 'configuracoes',
    title: 'Configurações · Trechos',
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  { path: '**', redirectTo: '' },
];
