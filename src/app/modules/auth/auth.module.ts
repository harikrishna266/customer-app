import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './auth.component';
import { AppRoutingModule } from '../../app-routing.module';
@NgModule({
  declarations: [
    AuthComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
  ]
})

export class AuthModule {
}
