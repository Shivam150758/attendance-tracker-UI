import { Component, TemplateRef, ViewChild } from '@angular/core';
import { LoaderService } from 'src/service/Loader/loader.service';
import * as moment from 'moment-timezone';
import { Router } from '@angular/router';
import { SharedService } from 'src/service/EventEmitter/shared.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ThemePalette, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { MatSort } from '@angular/material/sort';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  providers: [provideNativeDateAdapter()]
})
export class UserDashboardComponent {

  currentQuarter!: number;
  currentYear!: number;
  private subscription: Subscription;
  selectedDate: Date | null = null;
  selectedAttendance: any;
  options: any[] = [];
  shiftOptions: any[] = ['Shift A', 'Shift B', 'Shift C', 'Shift D', 'Shift E'];
  number: number = 0;
  remaining: any = 0;
  days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  dialogRef1!: MatDialogRef<any>;
  dialogRef2!: MatDialogRef<any>;
  detailedAttendancePopup!: MatDialogRef<any>;
  username: any;
  team: any;
  shift: any;
  oldShift: any;
  attendanceData: any = {
    wfo: 0,
    leaves: 0,
    holidays: 0,
    wfhFriday: 0,
    wfoFriday: 0,
  };
  detailedArray: any[] = [];
  popUpTitle: any;
  color: ThemePalette = 'warn';
  mode: ProgressSpinnerMode = 'determinate';
  value = 80;
  selectedYear: any;
  selectedQuarter: any;
  selectedUser: any;
  months: string[] = [];

  @ViewChild('dialogTemplate')
  dialogTemplate!: TemplateRef<any>;

  @ViewChild('confirmationPopUp')
  confirmationPopUp!: TemplateRef<any>;

  @ViewChild('detailedAttendance')
  detailedAttendance!: TemplateRef<any>;

  @ViewChild(MatSort)
  sort!: MatSort;

  displayedColumns: string[] = ['date', 'attendance'];

  time!: string;
  email!: any;
  now!: moment.Moment;
  attendanceError: boolean = false;
  attendanceSuccess: boolean = false;
  distinctYears: string[] = [];
  distinctQuarters: string[] = [];
  formattedDate!: string;
  managerId: any;
  approvalSuccess: boolean = false;
  approvalError: boolean = false;
  subOrdinates: any;
  admin: boolean = false;

  constructor(private loader: LoaderService, private router: Router, private sharedService: SharedService,
    private dialog: MatDialog, private api: ApiCallingService) {
    this.subscription = this.sharedService.popupTrigger.subscribe(data => {
      this.openPopup(data);
    });
  }

  async ngOnInit() {
    this.loader.show();
    let auth = sessionStorage.getItem('auth');
    if (auth !== 'Authorized') {
      this.router.navigateByUrl('/');
    } else {
      await this.getCurrentQuarterAndYear();
      await this.loadDistinctYears();
      await this.loadDistinctQuarters();
      await this.getSubordinates();
      this.selectedYear = this.currentYear.toString();
      this.selectedQuarter = "Q" + this.currentQuarter;
      let userDataString = sessionStorage.getItem('user');
      this.admin = sessionStorage.getItem('Admin') === "true";
      if (userDataString) {
        let userData = JSON.parse(userDataString);
        this.username = userData.name;
        this.email = userData.emailId;
        this.selectedUser = this.email;
        this.team = userData.team;
        this.shift = userData.shift;
        this.managerId = userData.managerId;
        this.oldShift = userData.shift;
        this.getUserAttendance();
      } else {

      }
    }
  }

  getSubordinates() {
    this.api.getListofSubOrdinates(this.email).subscribe({
      next: (subordinateResponse) => {
        this.subOrdinates = subordinateResponse;
        this.loader.hide();
      },
      error: (error) => {
        console.error("Error fetching subordinates list:", error);
        this.loader.hide();
      }
    });
  }

  getUserAttendance() {
    this.loader.show();
    if (this.selectedQuarter == 'Q1') {
      this.months = ['January', 'February', 'March']
    } else if (this.selectedQuarter == 'Q2') {
      this.months = ['April', 'May', 'June']
    } else if (this.selectedQuarter == 'Q3') {
      this.months = ['July', 'August', 'September']
    } else if (this.selectedQuarter == 'Q4') {
      this.months = ['October', 'November', 'December']
    }
    this.api.getUserAttendance(this.selectedUser, this.selectedYear, this.selectedQuarter).subscribe({
      next: (response) => {
        if (response) {
          this.attendanceData = response;
          this.number = response.wfh;
          this.remaining = 13 - this.number;
          this.value = (10 / 13) * 100;
        } else {
          this.attendanceData = {
            wfo: 0,
            leaves: 0,
            holidays: 0,
            wfhFriday: 0,
            wfoFriday: 0,
            number: 0
          };
        }
        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
      }
    });
  }

  getCurrentQuarterAndYear(): Promise<void> {
    return new Promise((resolve) => {
      this.now = moment.tz('Asia/Kolkata');
      this.currentQuarter = this.now.quarter();
      this.currentYear = this.now.year();
      this.time = this.now.format("DD-MMMM-YYYY HH:mm:ss");
      resolve();
    });
  }

  openPopup(data: any) {
    this.openDialog();
  }

  openDialog() {
    this.shift = this.oldShift
    this.selectedDate = null;
    this.selectedAttendance = null;
    this.dialogRef1 = this.dialog.open(this.dialogTemplate, {
      panelClass: 'custom-dialog-container',
      disableClose: true,
      width: '800px'
    });

    this.dialogRef1.afterClosed().subscribe(result => {
      if (result === 'reopen') {
        this.openDialog();
      }
    });
  }

  openDialog2() {
    this.dialogRef2 = this.dialog.open(this.confirmationPopUp, {
      panelClass: 'custom-dialog-container',
      disableClose: true,
      width: '500px'
    });

    this.dialogRef2.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.dialogRef1.close();
      } else {
      }
    });
  }

  confirmAttendance() {
    this.loader.show();
    this.dialogRef2.close('confirm');
    this.now = moment.tz('Asia/Kolkata');
    this.time = this.now.format("DD-MMMM-YYYY HH:mm:ss");
    this.formattedDate = moment(this.selectedDate).format('DD-MMMM-YYYY');
    const selDate = moment(this.selectedDate);
    const year = selDate.year();
    const quarter = selDate.quarter();
    const month = selDate.month();

    this.api.attendance(this.email, this.email, this.formattedDate, this.selectedAttendance, year.toString(),
      "Q" + quarter, (month + 1).toString(), this.email, this.time.toString(), this.shift).subscribe({
        next: (response) => {
          this.api.addUserAttendance(this.email, this.email, this.selectedAttendance, year.toString(),
            "Q" + quarter, this.username).subscribe({
              next: (response) => {
                this.api.addMonthlyAttendance(this.email, this.email, this.selectedAttendance, year.toString(),
                  "Q" + quarter, this.username, (month + 1).toString()).subscribe({
                    next: (response) => {
                      this.loader.hide();
                      let currentUrl = this.router.url;
                      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate([currentUrl]);
                      });
                    },
                    error: (error) => {
                      this.loader.hide();
                      console.error("Error adding user attendance:", error);
                    }
                  });
              },
              error: (error) => {
                this.loader.hide();
                console.error("Error adding user attendance:", error);
              }
            });
        },
        error: (error) => {
          this.loader.hide();
          this.attendanceError = true;
          setTimeout(() => {
            this.attendanceError = false;
          }, 2000);
          console.error("Error calling attendance API:", error);
        }
      });
  }

  cancelAttendance() {
    this.dialogRef2.close();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  myFilter = (d: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d ? d <= today : false;
  };

  dateChanged(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = event.value;
    if (this.selectedDate) {
      const dayOfWeek = this.selectedDate.getDay();
      const dayName = this.days[dayOfWeek];

      if (dayName === 'Friday') {
        this.options = ['Work From Home - Friday', 'Work From Office - Friday', 'Leave', 'Public Holiday'];
      } else {
        this.options = ['Work From Office', 'Work From Home', 'Leave', 'Public Holiday']
      }
    } else {
    }
  }

  categoryAttendance(attendance: string) {
    if (attendance == 'Attendance') {
      this.api.getDetailedAttendanceQtr(this.selectedUser, this.selectedYear, this.selectedQuarter).subscribe({
        next: (response) => {
          this.detailedArray = response;
          this.loader.hide();
        },
        error: (error) => {
          this.loader.hide();
        }
      });
    } else {
      this.api.getCategoryAttendance(this.email, this.selectedQuarter, this.selectedYear, attendance
      ).subscribe({
        next: (response) => {
          this.detailedArray = response;
          this.loader.hide();
        },
        error: (error) => {
          this.loader.hide();
        }
      });
    }

    this.popUpTitle = attendance + ' For ' + this.selectedQuarter + ' ' + this.selectedYear
    this.detailedAttendancePopup = this.dialog.open(this.detailedAttendance, {
      panelClass: 'custom-dialog-container',
      disableClose: true,
      width: '500px'
    });
  }

  sortAscending: boolean = false;

  sortData() {
    this.sortAscending = !this.sortAscending;
    this.detailedArray.sort((a, b) => {
      if (this.sortAscending) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
  }

  loadDistinctYears(): Promise<void> {
    return new Promise((resolve) => {
      const observer = {
        next: (data: string[]) => this.distinctYears = data,
        error: (err: any) => console.error('Error fetching distinct years', err),
        complete: () => console.log('Fetching distinct years completed')
      };
      this.api.distinctYear().subscribe(observer);
      resolve();
    });
  }

  loadDistinctQuarters(): Promise<void> {
    return new Promise((resolve) => {
      const observer = {
        next: (data: string[]) => this.distinctQuarters = data,
        error: (err: any) => console.error('Error fetching distinct quarters', err),
        complete: () => console.log('Fetching distinct quarters completed')
      };
      this.api.distinctQuarter().subscribe(observer);
      resolve();
    });
  }

  sendForApproval() {
    const selDate = moment(this.selectedDate);
    this.formattedDate = moment(this.selectedDate).format('DD-MMMM-YYYY');
    const month = selDate.month();
    this.loader.show();
    this.dialogRef2.close('confirm');
    let type;
    if ((this.oldShift != this.shift) && this.number > 12 && (this.selectedAttendance == "Work From Home")) {
      type = "Extra WFH and Shift Change"
    } else if (this.oldShift != this.shift) {
      type = "Shift Change"
    } else if (this.number > 12) {
      type = "Extra WFH"
    }

    let approvalList = {
      id: this.email + this.formattedDate,
      date: this.formattedDate,
      year: this.selectedYear,
      quarter: this.selectedQuarter,
      month: (month + 1).toString(),
      raisedBy: this.email,
      name: this.username,
      raisedTo: this.managerId,
      comments: type,
      status: "Pending",
      type: type,
      prevAttendance: "",
      prevShift: this.oldShift,
      newAttendance: this.selectedAttendance,
      newShift: this.shift
    };

    this.api.checkAttendanceDuplicate(this.email, this.formattedDate).subscribe({
      next: (response) => {
        if (response.status === "Not Exist") {
          this.loader.show();
          this.api.sendForApproval(approvalList).subscribe({
            next: (response) => {
              if (response === "ApprovalList saved successfully.") {
                this.approvalSuccess = true;
                setTimeout(() => {
                  this.approvalSuccess = false;
                }, 3000);
              } else if (response === "Error: ApprovalList with this ID already exists.") {
                this.approvalError = true;
                setTimeout(() => {
                  this.approvalError = false;
                }, 3000);
              }
              this.loader.hide();
            },
            error: (error) => {
              console.error("Error during API call:", error);
              this.loader.hide();
            }
          });
        } else if (response.status === "Exist") {
          console.log()
          this.attendanceError = true;
          setTimeout(() => {
            this.attendanceError = false;
          }, 2000);
        }
        this.loader.hide();
      },
      error: (error) => {
        console.error("Error during API call:", error);
        this.loader.hide();
      }
    })
  }
}