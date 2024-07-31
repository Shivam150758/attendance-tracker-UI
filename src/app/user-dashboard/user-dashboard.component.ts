/* eslint-disable @typescript-eslint/no-explicit-any */
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
  shiftOptions: any[] = ['Shift A', 'Shift B', 'Shift C', 'Shift D', 'Shift F'];
  number: number = 0;
  remaining: any = 0;
  days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  dialogRef1!: MatDialogRef<any>;
  dialogRef2!: MatDialogRef<any>;
  detailedAttendancePopup!: MatDialogRef<any>;
  username: any;
  team: any;
  defaultShift: any;
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
  months: { [key: string]: string[] } = {
    "Q1": ['January', 'February', 'March'],
    "Q2": ['April', 'May', 'June'],
    "Q3": ['July', 'August', 'September'],
    "Q4": ['October', 'November', 'December']
  };

  filteredMonths: string[] = [];

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

  maxNumber: number = 13;
  percentage: number = 0;
  cappedPercentage: number = 0;
  leftRotation: string = 'rotate(0deg)';
  rightRotation: string = 'rotate(0deg)';
  monthMapping: { [key: string]: string } = {
    '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May', '6': 'June',
    '7': 'July', '8': 'August', '9': 'September', '10': 'October', '11': 'November', '12': 'December'
  };
  allowanceData: { [key: string]: number } = {};
  allowances: any;
  filteredShiftOptions: any[] = this.shiftOptions;

  constructor(private loader: LoaderService, private router: Router, private sharedService: SharedService,
    private dialog: MatDialog, private api: ApiCallingService) {
    this.subscription = this.sharedService.popupTrigger.subscribe(data => {
      this.openPopup(data);
    });
  }

  async ngOnInit() {
    this.loader.show();
    const auth = sessionStorage.getItem('auth');
    if (auth !== 'Authorized') {
      this.router.navigateByUrl('/');
    } else {
      await this.getCurrentQuarterAndYear();
      await this.loadDistinctYears();
      await this.loadDistinctQuarters();
      this.selectedYear = this.currentYear.toString();
      this.selectedQuarter = "Q" + this.currentQuarter;
      const userDataString = sessionStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.username = userData.name;
        this.email = userData.emailId;
        this.selectedUser = this.email;
        this.team = userData.team;
        this.defaultShift = userData.shift;
        this.shift = userData.shift;
        this.managerId = userData.managerId;
        this.oldShift = userData.shift;

        try {
          await this.getUserAttendance();
          if (userData.admin) {
            this.admin = true;
            await this.getSubordinates();
          }
        } catch (error) {
          console.error('Error during initialization:', error);
        } finally {
          this.loader.hide();
        }
      } else {
        sessionStorage.removeItem('user');
        this.router.navigateByUrl('/');
      }
    }
  }

  filterMonths(): void {
    this.filteredMonths = this.months[this.selectedQuarter] || [];
  }

  updateProgress(number: number) {
    this.percentage = (number / this.maxNumber) * 100;
    this.cappedPercentage = Math.min(this.percentage, 100);

    const angle = (this.cappedPercentage / 100) * 360;

    if (this.cappedPercentage <= 50) {
      this.rightRotation = `rotate(${angle}deg)`;
      this.leftRotation = 'rotate(0deg)';
    } else {
      this.rightRotation = 'rotate(180deg)';
      this.leftRotation = `rotate(${angle - 180}deg)`;
    }
  }

  getProgressBarClass(): string {
    if (this.percentage < 60) {
      return 'green';
    } else if (this.percentage >= 60 && this.percentage < 85) {
      return 'yellow';
    } else if (this.percentage >= 85 && this.percentage < 95) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  getSubordinates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.api.getListofSubOrdinates(this.email).subscribe({
        next: (subordinateResponse) => {
          this.subOrdinates = [];
          const hardCodedEmail = {
            "id": this.email,
            "emailId": this.email,
            "name": this.username
          };
          this.subOrdinates.push(hardCodedEmail);
          if (Array.isArray(subordinateResponse)) {
            this.subOrdinates.push(...subordinateResponse);
          }
          resolve();
          this.loader.hide();
        },
        error: (error) => {
          console.error("Error fetching subordinates list:", error);
          this.loader.hide();
          reject(error);
        }
      });
    });
  }

  getUserAttendance(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.show();
      this.api.getUserAttendance(this.selectedUser, this.selectedYear, this.selectedQuarter).subscribe({
        next: (response) => {
          if (response) {
            this.attendanceData = response;
            this.number = response.wfh;
            this.remaining = 13 - this.number;
            this.updateProgress(this.number);
            this.api.userMonthlyAllowanceData(this.selectedUser, this.selectedYear, this.selectedQuarter).subscribe({
              next: (_response) => {
                this.allowances = _response;
                this.filterMonths();
                this.transformData();
                resolve();
                this.loader.hide();
              },
              error: (_error) => {
                this.loader.hide();
                reject(_error);
              }
            });
          } else {
            this.attendanceData = {
              wfo: 0,
              leaves: 0,
              holidays: 0,
              wfhFriday: 0,
              wfoFriday: 0,
              number: 0
            };
            resolve();
            this.loader.hide();
          }
        },
        error: (error) => {
          this.loader.hide();
          reject(error);
        }
      });
    });
  }


  transformData(): void {
    this.allowanceData = {};
    for (const allowance of this.allowances) {
      const monthName = this.monthMapping[allowance.month];
      if (!this.allowanceData[monthName]) {
        this.allowanceData[monthName] = 0;
      }
      this.allowanceData[monthName] += allowance.allowance + allowance.foodAllowance;
    }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      } else { /* empty */ }
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
    let allowance = 0;
    let foodAllowance = 0;

    if (this.selectedAttendance == 'Public Holiday' || this.selectedAttendance == 'Leave') {
      allowance = 0;
      foodAllowance = 0;
    } else {
      if (this.shift == "Shift A") {
        allowance = 0;
        foodAllowance = 0;
      } else if (this.shift == "Shift B") {
        allowance = 150;
        foodAllowance = 100;
      } else if (this.shift == "Shift C") {
        allowance = 250;
        foodAllowance = 100;
      } else if (this.shift == "Shift D") {
        allowance = 350;
        foodAllowance = 100;
      } else if (this.shift == "Shift F") {
        allowance = 250;
        foodAllowance = 0;
      }
    }

    this.loader.show();
    this.api.attendance(this.email, this.email, this.formattedDate, this.selectedAttendance, year.toString(),
      "Q" + quarter, (month + 1).toString(), this.email, this.time.toString(), this.shift, allowance, foodAllowance).subscribe({
        next: () => {
          this.loader.show();
          this.api.addUserAttendance(this.email, this.email, this.selectedAttendance, year.toString(),
            "Q" + quarter, this.username).subscribe({
              next: () => {
                this.loader.show();
                this.api.addMonthlyAttendance(this.email, this.email, this.selectedAttendance, year.toString(),
                  "Q" + quarter, this.username, (month + 1).toString(), allowance, foodAllowance).subscribe({
                    next: () => {
                      const currentUrl = this.router.url;
                      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate([currentUrl]);
                      });
                      this.loader.hide();
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
    if (!d) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const specificDisabledDates = [
      new Date(2024, 7, 15),
      new Date(2024, 9, 2),
      new Date(2024, 9, 31),
      new Date(2024, 10, 1),
      new Date(2024, 11, 25)
    ];

    const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
    const isAfterToday = d > today;
    const isBeforeStart = d < new Date(2024, 4, 1);
    const isSpecificDisabledDate = specificDisabledDates.some(disabledDate =>
      d.getFullYear() === disabledDate.getFullYear() &&
      d.getMonth() === disabledDate.getMonth() &&
      d.getDate() === disabledDate.getDate()
    );

    return !isWeekend && !isAfterToday && !isBeforeStart && !isSpecificDisabledDate;
  };


  dateChanged(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = event.value;
    this.selectedAttendance = null;
    this.filteredShiftOptions = this.shiftOptions;
    this.shift = this.defaultShift;
    this.shiftOptions = ['Shift A', 'Shift B', 'Shift C', 'Shift D', 'Shift F'];
    if (this.selectedDate) {
      const dayOfWeek = this.selectedDate.getDay();
      const dayName = this.days[dayOfWeek];

      if (dayName === 'Friday') {
        this.options = ['Work From Home - Friday', 'Work From Office - Friday', 'Leave'];
      } else {
        this.options = ['Work From Office', 'Work From Home', 'Leave']
      }
    } else { /* empty */ }
  }

  onAttendanceChange(): void {
    if (this.selectedAttendance === 'Leave') {
      this.filteredShiftOptions = ['Absent'];
      this.shiftOptions = ['Absent'];
      this.shift = 'Absent';
    } else if (this.selectedAttendance === 'Public Holiday') {
      this.filteredShiftOptions = ['Holiday'];
      this.shiftOptions = ['Holiday'];
      this.shift = 'Holiday';
    } else {
      this.shiftOptions = ['Shift A', 'Shift B', 'Shift C', 'Shift D', 'Shift F'];
      this.filteredShiftOptions = this.shiftOptions.filter(option => option !== 'Holiday' && option !== 'Absent');
      this.shift = this.defaultShift;
    }
  }

  categoryAttendance(attendance: string) {
    if (attendance == 'Attendance') {
      this.loader.show();
      this.api.getDetailedAttendanceQtr(this.selectedUser, this.selectedYear, this.selectedQuarter).subscribe({
        next: (response) => {
          this.detailedArray = response;
          this.loader.hide();
        },
        error: () => {
          this.loader.hide();
        }
      });
    } else {
      this.loader.show();
      this.api.getCategoryAttendance(this.email, this.selectedQuarter, this.selectedYear, attendance
      ).subscribe({
        next: (response) => {
          this.detailedArray = response;
          this.loader.hide();
        },
        error: () => {
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
    const year = selDate.year();
    const quarter = selDate.quarter();
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

    const approvalList = {
      id: this.email + this.formattedDate,
      date: this.formattedDate,
      year: year,
      quarter: "Q" + quarter,
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

    this.loader.show();
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