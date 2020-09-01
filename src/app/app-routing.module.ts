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
      {
        path: 'home',
        loadChildren: './modules/home/home.module#HomeModule'
      }

    ]
  }
];

@NgModule({

  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
