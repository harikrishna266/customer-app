import {Component, Inject, Renderer2, HostListener, ElementRef, ViewChild, Optional, ContentChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {fadeAnimation} from 'src/app/core/animations/fade.animations';
import {TripService} from 'src/app/core/services/trip.service';
import {DOCUMENT} from '@angular/common';
import {CompanyProfileService} from 'src/app/core/services/company-profile.service';
import {CommunicationService} from 'src/app/core/services/communication.service';
import {UploadedDocumentService} from '../../core/services/uploadedDocument.service';
import {UploadViewerComponent} from '../../core/common/upload-viewer/upload-viewer.component';
import {zip} from "rxjs";
import {StoreService} from "../../core/services/store.service";
import {Router} from "@angular/router";
import { UserService } from 'src/app/core/services/user.service';
import { ResetPasswordComponent } from 'src/app/core/elements/reset-password/reset-password.component';

@Component({
	selector: 'app-auth',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	animations: [fadeAnimation]
})
export class AuthComponent {

	open = true;
	userMenu = false;
	menus = [];
	notificationCount = '0';
	notificationGlow = false;
	theme = false;
	onmiTracks = false;
	issacEld = false;
	notifications = [];
	drivers = [];
	currentChatDriver;
	messages = [];
	topMenu = [];

	constructor(
		public dialog: MatDialog,
		public tripSer: TripService,
		public storeSer: StoreService,
		public companyProfile: CompanyProfileService,
		public communicationSer: CommunicationService,
		public userSer: UserService,
		public uploadedDocumentService: UploadedDocumentService,
		public router: Router,
		@Inject(DOCUMENT) private document: Document,
		private renderer: Renderer2,
	) {
		this.getCompanyProfile();
		this.renderer.setAttribute(this.document.body, 'theme', this.theme ? 'darktheme' : 'lighttheme');
		this.getNotificationCount();
		this.chatInfo();
		this.getUserPermissions();
	}

	chatInfo() {
		this.communicationSer
			.getAllDriversForMessaging()
			.subscribe((res: any) => {
				this.drivers = res.data.map(e => {
					return {
						name: `${e.firstName} ${e.lastName} `,
						id: e.id,
						online: e.driverEldId ? true : false,
						selected: false
					}
				});
			})
	}

	getUserPermissions() {
		this.userSer.getUserPermissions().subscribe((res: any) => {
			this.menus = res.data.leftMenuList.map(e => e = Object.assign({}, e, {open: false}));
			this.topMenu = res.data.topMenuList;
			this.setDefaults(res.data.topMenuList)
		});
	}

	setDefaults(topMenu) {
		const tripPlaning = topMenu[2].chlidrenConfigList[0].description;
		this.storeSer.tripPlanDefault = tripPlaning;
	}

	getNotification() {
		this.communicationSer.getAllNotifications()
			.subscribe((res: any) => {
				this.notifications = res.data;
			})
	}

	notificationAction($event) {
		if ($event.event === 'attachment') {
			zip(this.uploadedDocumentService.getDocumentByUploadedDocumentId($event.row.documentId),
				this.uploadedDocumentService.getUploadedDocumentById($event.row.documentId))
				.subscribe((res: any) => {
					const dialogRef = this.dialog.open(UploadViewerComponent, {
						data: {
							id: $event.row.documentId,
							src: new Uint8Array(res[0].body),
							fileName: res[0].headers.get('fileName'),
							file: res[0].body,
							approval: {
								status: res[1].data.uploadedDocument.status,
								entityId: res[1].data.entityId,
								entityType: res[1].data.entityType,
								communicationId: $event.row.id
							}
						}
					});
					dialogRef.componentInstance.indexEvent.subscribe((data: any) => {
							this.communicationSer.archiveNotifications($event.row.id).subscribe();
					});
					dialogRef.afterClosed().subscribe(() => this.reloadNotification());
				});
		} else if ($event.event === 'archive') {
			this.communicationSer.archiveNotifications($event.row.id)
				.subscribe(res => this.reloadNotification());
		} else {
			const status = $event.event === 'approve' ? 'APPROVED' : 'REJECTED';
			this.communicationSer.acceptrejectNotifications($event.row.segmentId, status)
				.subscribe(res => this.reloadNotification());
		}
	}

	reloadNotification() {
		this.getNotification();
		this.getNotificationCount();
	}

	getCompanyProfile() {
		this.companyProfile
			.getProfile()
			.subscribe(res => {
				const eldprovider = res.data;
				this.onmiTracks = eldprovider.eldProvider === "OMNITRACS";
				this.issacEld = eldprovider.eldProvider === "ISAAC";
				this.storeSer.SCACcode = eldprovider.scacCode;
				this.storeSer.carrierCode = eldprovider.carrierCode;
			})
	}

	playAudio() {
		const audio = new Audio('./assets/sounds/notification_tune.mp3');
		audio.play();
	}

	resetPassword() {
		console.log(this.storeSer.userId);
		this.dialog.open(ResetPasswordComponent, {
			data: {id: this.storeSer.userId},
			maxWidth: '600px',
			width: '600px',
			panelClass: 'eleet-dailog',
			disableClose: true
		}).afterClosed().subscribe(res => { });
	}

	logout() {
		this.storeSer.token = '';
		this.router.navigate(['/login']);
	}

	chatActions(event) {
		if (event.event === 'get-user-chat') {
			const drivers = this.drivers.filter(e => e.selected === true).map(e => e = e.id);

			this.newUserMessages(drivers);
		}
		if (event.event === 'send-message') {
			this.sendMessage(event.payload.communicationPayload);
		}
	}

	sendMessage(payload) {
		const drivers = this.drivers.filter(e => e.selected === true).map(e => e = e.id);
		this.communicationSer.sendMessage({payload, drivers})
			.subscribe(res => {
				this.newUserMessages(drivers[0]);
			})
	}

	newUserMessages(driver) {
		this.currentChatDriver = driver;
		this.communicationSer.getDriverChats(driver)
			.subscribe((res: any) => {
				this.messages = res.data.map(e => {
					return {
						message: e.communicationPayload,
						isReply: e.senderDriver ? false : true,
						image: '',
						time: e.receivedOn,
						read: e.readOn ? true : false,
					}
				});
			})
	}

	toggleTheme() {
		this.theme = !this.theme;
		this.storeSer.theme = this.theme;
		this.renderer.setAttribute(this.document.body, 'theme', this.theme ? 'darktheme' : 'lighttheme');
	}

	socket($event) {
		if ($event && $event.message &&
			$event.message.websocketPayload &&
			$event.message.websocketPayload.operation === 'PUBLISHED' &&
			$event.message.websocketPayload.entity === 'TRIP'
		) {
			this.getNotificationCount();
		}
		if ($event && $event.message &&
			$event.message.websocketPayload &&
			$event.message.websocketPayload.operation === 'FILE_DOWNLOADED' &&
			$event.message.websocketPayload.entity === 'TRIP'
		) {
			this.getNotificationCount();
		}
		if ($event && $event.message &&
			$event.message.websocketPayload &&
			$event.message.websocketPayload.operation === 'RECEIVED' &&
			$event.message.websocketPayload.entity === 'MESSAGE'
		) {
			//if(this.currentChatDriver) {
			const drivers = this.drivers.filter(e => e.selected === true).map(e => e = e.id);

			this.newUserMessages(drivers[0]);
			//}

		}
	}

	getNotificationCount() {
		this.tripSer.getNotificationCount()
			.subscribe((res: any) => {
				this.notificationGlow = true;
				setTimeout(() => {
					this.notificationGlow = false;
				}, 1000)
				if(res.data.count !== this.notificationCount) {
					this.playAudio();
				}
				this.notificationCount = String(res.data.count);
			});
	}

	public getRouterOutletState(outlet) {
		return outlet.isActivated ? outlet.activatedRoute : '';
	}

	toggleLeftMenu() {
		this.open = !this.open;
	}

	toggleUserMenu() {
		this.userMenu = !this.userMenu
	}

	languge(lan) {
		// this.translate.use(lan);
	}

	getBackround(i) {
		const colors = ['#4F63BD','#045769', '#106E70', '#81c784', '#e67f0e', '#ef5350', '#26a69a', '#1dc784'];
		return colors[i];
	}

}

export const menus = [
	{
		title: 'Company',
		svgIcon: 'company',
		childMenu: [
			{
				title: 'Profile',
				svgIcon: 'company',
				link: ['/company-profile'],
			},
			{
				title: 'Truck Drivers',
				svgIcon: 'driver',
				link: ['/drivers'],
			},
			{
				title: 'Truck Drivers Teams',
				svgIcon: 'driver-teams',
				link: ['/drivers-teams'],
			},
			{
				title: 'Office Employees',
				svgIcon: 'office-employees',
				link: ['/office-employees/listing'],
			},
			{
				title: 'Shop Employees',
				svgIcon: 'shop-employees',
				link: ['/shop-employees/listing'],
			},
			{
				title: 'Company-Seals',
				svgIcon: 'company-seal',
				link: ['/seals/listing'],
			},
			{
				title: 'Passengers',
				svgIcon: 'passenger',
				link: ['/passengers'],
			}
		]
	},
	{
		title: 'Vehicle',
		svgIcon: 'vehicles',
		childMenu: [
			{
				title: 'Trucks',
				svgIcon: 'truck',
				link: ['/trucks'],
			},
			{
				title: 'Trailers',
				svgIcon: 'trailer',
				link: ['/trailers'],
			}

		]
	},
	{
		title: 'Contacts',
		svgIcon: 'contact',
		childMenu: [
			{
				title: 'Clients (Bill To) ',
				svgIcon: 'client',
				link: ['/contactbillto'],
			},
			{
				title: 'Points',
				svgIcon: 'point',
				link: ['/points'],
			},
			{
				title: 'Contacts (Brokered Load)',
				svgIcon: 'brok-load-contacts',
				link: ['/contbrkload'],
			},
			{
				title: 'Owner Operator',
				svgIcon: 'owner-operator',
				link: ['/contactownroprtr'],
			},
			{
				title: 'Customs Brokers',
				svgIcon: 'customs-brkr-contacts',
				link: ['/contactcustbrkr'],
			},
		]
	},
	{
		title: 'Inventory',
		svgIcon: 'inventory',
		childMenu: [
			{
				title: 'Inventory List',
				svgIcon: 'inventory-sub',
				link: ['/inventory'],
			}
		]
	},
	{
		title: 'Reports',
		svgIcon: 'report',
		childMenu: [
			{
				title: 'Accounts Receivable Report',
				svgIcon: 'report',
				link: ['/accntreceivreprt'],
			},
			{
				title: 'Trip Report',
				svgIcon: 'trip-report',
				link: ['/triptreport'],
			},
			{
				title: 'Maintainance reports',
				svgIcon: 'trip-report',
				link: ['/maintainance-reports'],
			}
		]
	},
	{
		title: 'Support',
		svgIcon: 'support',
		childMenu: [
			{
				title: 'All company requests',
				svgIcon: '',
				link: ['/support'],
			},
			{
				title: 'My requests',
				svgIcon: '',
				link: ['/support'],
			}
		]
	},
	{
		title: 'Administration',
		svgIcon: 'administration',
		childMenu: [
			{
				title: 'Accounting Configuration',
				svgIcon: 'payroll',
				link: ['/accounting'],
			},
			{
				title: 'User & Role Management',
				svgIcon: 'clients',
				link: ['/roles/listing'],
			}, {
				title: 'Unit Of Measure',
				svgIcon: 'point-edit',
				link: ['/unit-measure'],
			}
		]
	},

];
