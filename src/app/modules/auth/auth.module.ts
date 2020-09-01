import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthComponent} from './auth.component';
import {CoreModule} from 'src/app/core/core.module';
import {RouterModule} from '@angular/router';
import {TripTabsModule} from '../app-header-tabs/trip-tabs.module';
import {EleetElementsModule} from 'eleet-style-guide';

@NgModule({
	declarations: [
		AuthComponent
	],
	imports: [
		CommonModule,
		RouterModule,
		TripTabsModule,
		EleetElementsModule,
		CoreModule,
	]
})
export class AuthModule {
}
