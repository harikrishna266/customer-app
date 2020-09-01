import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { AuthComponent } from './modules/auth/auth.component';

const routes: Routes = [
  {
    path: 'login', component: LoginComponent
  },
  {
    path: '', component: AuthComponent, children: [
      { path: '',     loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule)},
      {path: '**', loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule)}

    ]
  }
];

@NgModule({
  declarations: [
    AuthComponent
  ],
  imports: [RouterModule.forRoot(routes)],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
