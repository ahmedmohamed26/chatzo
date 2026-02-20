import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/sign-in' },
  {
    path: 'auth/sign-in',
    loadComponent: () => import('./features/auth/sign-in.component').then((m) => m.SignInComponent),
  },
  {
    path: 'auth/sign-up',
    loadComponent: () => import('./features/auth/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'channels',
    canActivate: [authGuard],
    loadComponent: () => import('./features/channels/channels.component').then((m) => m.ChannelsPageComponent),
  },
  {
    path: 'inbox',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inbox/inbox.component').then((m) => m.InboxComponent),
  },
  {
    path: 'ai-conversation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ai-conversation/ai-conversation.component').then((m) => m.AiConversationComponent),
  },
  {
    path: 'quick-replies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quick-replies/quick-replies-page.component').then((m) => m.QuickRepliesPageComponent),
  },
  {
    path: 'team',
    canActivate: [authGuard],
    loadComponent: () => import('./features/team/team.component').then((m) => m.TeamComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'auth/sign-in' },
];
