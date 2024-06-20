import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { SharedService } from 'src/service/EventEmitter/shared.service';
import { LoaderService } from 'src/service/Loader/loader.service';

interface ApprovalListResponse {
  raisedByList: any[];
  raisedToList: any[];
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {

  email: any;
  detailedArray: any;
  admin: boolean = false;
  raisedByList!: any[];
  raisedToList!: any[];
  badgeCount: any;

  constructor(private loader: LoaderService, private sharedService: SharedService, 
    private api: ApiCallingService, private http: HttpClient ) {  }

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
    this.badgeCount = 0;
    await this.getApprovalList(this.email).subscribe(
      (response: ApprovalListResponse) => {
        this.raisedByList = response.raisedByList;
        this.raisedToList = response.raisedToList;
        this.raisedToList.forEach(element => {
          if(element.status == 'Pending') {
            this.badgeCount++;
          }
        });
        this.loader.hide();
      },
      (error: any) => {
        console.error("Error fetching approval list:", error);
        this.loader.hide();
      }
    );
  }

  getApprovalList(emailId: string): Observable<ApprovalListResponse> {
    const apiUrl = 'http://localhost:8080/requestApproval';
    const payload = { raisedBy: emailId, raisedTo: emailId };
    return this.http.post<ApprovalListResponse>(apiUrl, payload);
  }

  onButtonClick(data: any): void {
    this.sharedService.triggerPopup(data);
  }

}
