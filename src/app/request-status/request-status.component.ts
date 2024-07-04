import { HttpClient } from '@angular/common/http';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { LoaderService } from 'src/service/Loader/loader.service';

interface ApprovalListResponse {
  raisedByList: any[];
  raisedToList: any[];
}

@Component({
  selector: 'app-request-status',
  templateUrl: './request-status.component.html',
  styleUrl: './request-status.component.css'
})
export class RequestStatusComponent {
  emailId: any;
  raisedByList: any[] = [];
  raisedToList: any[] = [];
  admin: boolean = false;

  @ViewChild('reqDetails')
  reqDetailsPopup!: TemplateRef<any>;
  popupdetail: any;
  approvalList: any;
  dialogRef: any;

  constructor(private loader: LoaderService, private api: ApiCallingService,
    private http: HttpClient, private dialog: MatDialog, private router: Router) { }

  ngOnInit() {
    this.loader.show();
    let userDataString = sessionStorage.getItem('user');
    let show = sessionStorage.getItem('Admin');
    if (show == 'true') {
      this.admin = true
    }
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.emailId = userData.emailId;
    }
    this.getApprovalList(this.emailId).subscribe(
      (response: ApprovalListResponse) => {
        this.raisedByList = response.raisedByList;
        this.raisedToList = response.raisedToList;
        this.loader.hide();
      },
      (error) => {
        console.error("Error fetching approval list:", error);
        this.loader.hide();
      }
    );
  }

  getApprovalList(emailId: string): Observable<ApprovalListResponse> {
    // let baseUrl = environment.apiUrl;
    let baseUrl = "http://localhost:8080";

    let apiUrl = `${baseUrl}/requestApproval`;
    const payload = { raisedBy: emailId, raisedTo: emailId };
    return this.http.post<ApprovalListResponse>(apiUrl, payload);
  }

  approve(item: any) {
    item.status = "Approved";
    this.dialogRef.close();
    this.loader.show();
    this.api.updateAttendanceApproval(item).subscribe({
      next: (response) => {
        this.loader.hide()
      },
      error: (error) => {
        console.error("Error during API call:", error);
        this.loader.hide();
      }
    })
  }

  reject(item: any) {
    item.status = "Rejected";
    this.dialogRef.close();
    this.loader.show();
    this.api.updateAttendanceApproval(item).subscribe({
      next: (response) => {
        this.loader.hide()
      },
      error: (error) => {
        console.error("Error during API call:", error);
        this.loader.hide();
      }
    })
  }

  revoke(item: any) {
    item.status = "Delete";
    this.dialogRef.close();
    this.loader.show();
    this.api.updateAttendanceApproval(item).subscribe({
      next: (response) => {
        this.loader.hide()
        let currentUrl = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([currentUrl]);
        });
      },
      error: (error) => {
        console.error("Error during API call:", error);
        this.loader.hide();
      }
    })
  }

  openReqDetails(item: any) {
    this.approvalList = item;
    this.dialogRef = this.dialog.open(this.reqDetailsPopup, {
      panelClass: 'custom-dialog-container',
      disableClose: true,
      width: '800px'
    });
  }

}
