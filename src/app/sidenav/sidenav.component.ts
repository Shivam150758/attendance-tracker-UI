import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { SharedService } from 'src/service/EventEmitter/shared.service';
import { LoaderService } from 'src/service/Loader/loader.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {

  email: any;
  detailedArray: any;
  admin: boolean = false;
  constructor(private loader: LoaderService, private sharedService: SharedService, private api: ApiCallingService) {

  }

  async ngOnInit() {
    this.loader.show();
    let userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.email = userData.emailId;
    }
    await this.api.getListofSubOrdinates(this.email).subscribe({
      next: (subordinateResponse) => {
        if (Array.isArray(subordinateResponse) && subordinateResponse.length > 0) {
          sessionStorage.setItem('Admin', "true");
        } else {
          sessionStorage.setItem('Admin', "false");
        }
        this.admin = sessionStorage.getItem('Admin') === "true";
        this.loader.hide();
      },
      error: (error) => {
        console.error("Error fetching subordinates list:", error);
        this.loader.hide();
      }
    });
  }

  onButtonClick(data: any): void {
    this.sharedService.triggerPopup(data);
  }

}
