import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidemenuComponent } from './sidemenu/sidemenu.component';
import { HeaderComponent } from './header/header.component';
import { CardsComponent } from './cards/cards.component';



@NgModule({
  declarations: [SidemenuComponent, HeaderComponent, CardsComponent],
  imports: [
    CommonModule
  ]
})
export class ElementsModule { }
