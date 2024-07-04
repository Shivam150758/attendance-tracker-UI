import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
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
    private api: ApiCallingService, private http: HttpClient) { }

  ngOnInit() {
    let userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.email = userData.emailId;
      this.admin = userData.admin;
    }
    
    this.badgeCount = 0;
    this.getApprovalList(this.email).subscribe(
      (response: ApprovalListResponse) => {
        this.raisedByList = response.raisedByList;
        this.raisedToList = response.raisedToList;
        this.raisedToList.forEach(element => {
          if (element.status == 'Pending') {
            this.badgeCount++;
          }
        });
      },
      (error: any) => {
        console.error("Error fetching approval list:", error);
      }
    );
  }

  getApprovalList(emailId: string): Observable<ApprovalListResponse> {
    let baseUrl = environment.apiUrl;
    // let baseUrl = "http://localhost:8080";

    let apiUrl = `${baseUrl}/requestApproval`;
    const payload = { raisedBy: emailId, raisedTo: emailId };
    return this.http.post<ApprovalListResponse>(apiUrl, payload);
  }

  onButtonClick(data: any): void {
    this.sharedService.triggerPopup(data);
  }
}