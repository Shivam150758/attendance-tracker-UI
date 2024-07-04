import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { LoaderService } from 'src/service/Loader/loader.service';
import * as moment from 'moment-timezone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent {
  username: any;
  emailId: any;
  team: any;
  now: any;
  currentQuarter: any;
  currentYear: any;
  time: any;
  attendanceData: any;
  lastlogin: any;
  distinctYears: string[] = [];
  distinctQuarters: string[] = [];
  selectedYear: any;
  selectedQuarter: any;
  selectedMonth: any;
  reportData: any[] = [];
  EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  EXCEL_EXTENSION = '.xlsx';
  mergedArray: any[] = [];
  distinctMonths!: string[];
  selectedRadio: string = "1";
  currentMonth: any;
  monthNames: { [key: string]: string } = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December'
  };
  detailedArray: any;
  daysInMonth: number[] = [];

  constructor(private api: ApiCallingService, private loader: LoaderService, private dialog: MatDialog,
    private router: Router) { }
  users: any = [];
  attendanceReportData: any = [];

  @ViewChild('userDetails')
  userDetailsPopup!: TemplateRef<any>;

  @ViewChild('downloadAttendanceReport')
  downloadReportPopup!: TemplateRef<any>;

  sortedColumn: string = 'wfh';
  sortAscending: boolean = true;
  dialogRef1!: MatDialogRef<any>;
  dialogRef!: MatDialogRef<any>;

  async ngOnInit() {
    this.loader.show();
    await this.getCurrentQuarterAndYear();
    await this.loadDistinctYears();
    await this.loadDistinctQuarters();
    let userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.emailId = userData.emailId;
    }
    let auth = sessionStorage.getItem('Admin');
    if (auth != 'true') {
      this.router.navigateByUrl('/');
    }
    this.selectedYear = this.currentYear.toString();
    this.selectedQuarter = "Q" + this.currentQuarter;
    this.selectedMonth = this.currentMonth.toString();
    this.loader.show();
    this.loader.show();
    this.getData();
  }

  getData() {
    this.api.downloadMonthlyAdminReport(this.selectedMonth, this.selectedYear).subscribe({
      next: (attendanceResponse) => {
        if (attendanceResponse) {
          this.attendanceReportData = attendanceResponse;
        }
        this.api.getListofSubOrdinates(this.emailId).subscribe({
          next: (subordinateResponse) => {
            this.detailedArray = subordinateResponse;
            this.mergedArray = this.detailedArray.map((user: any) => {
              const report = this.attendanceReportData.find((report: any) => report.emailId === user.emailId) || {};
              const defaultValues = {
                wfh: 0,
                wfo: 0,
                wfhFriday: 0,
                wfoFriday: 0,
                leaves: 0,
                holidays: 0
              };
              return { ...defaultValues, ...user, ...report };
            });
            console.log(this.mergedArray);
            this.loader.hide();
          },
          error: (error) => {
            console.error("Error fetching subordinates list:", error);
            this.loader.hide();
          }
        });
      },
      error: (error) => {
        console.error("Error fetching attendance report:", error);
        this.loader.hide();
      }
    });
  }

  getCurrentQuarterAndYear(): void {
    this.now = moment.tz('Asia/Kolkata');
    this.currentQuarter = this.now.quarter();
    this.currentYear = this.now.year();
    this.currentMonth = this.now.month() + 1;
    this.time = this.now.format("DD-MMMM-YYYY HH:mm:ss");
  }

  loadDistinctYears(): void {
    const observer = {
      next: (data: string[]) => this.distinctYears = data,
      error: (err: any) => console.error('Error fetching distinct years', err),
      complete: () => console.log('Fetching distinct years completed')
    };
    this.api.distinctYear().subscribe(observer);
  }

  loadDistinctQuarters(): void {
    const observer = {
      next: (data: string[]) => this.distinctQuarters = data,
      error: (err: any) => console.error('Error fetching distinct quarters', err),
      complete: () => console.log('Fetching distinct quarters completed')
    };
    this.api.distinctQuarter().subscribe(observer);
  }

  sortData(column: string) {
    this.sortAscending = this.sortedColumn === column ? !this.sortAscending : true;
    this.sortedColumn = column;
    this.mergedArray.sort((a: { [x: string]: number; }, b: { [x: string]: number; }) => {
      if (a[column] < b[column]) {
        return this.sortAscending ? -1 : 1;
      } else if (a[column] > b[column]) {
        return this.sortAscending ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  openUserDetails(user: any) {
    this.loader.show();
    this.username = user.name;
    this.emailId = user.emailId;
    this.team = user.team;
    this.lastlogin = user.lastLogin;
    this.api.getUserAttendance(this.emailId, this.currentYear.toString(), "Q" + this.currentQuarter).subscribe({
      next: (response) => {
        if (response) {
          this.attendanceData = response;
        }
        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
      }
    });
    this.dialogRef = this.dialog.open(this.userDetailsPopup, {
      panelClass: 'custom-dialog-container',
      disableClose: true,
      width: '800px'
    });
  }

  downloadReportPopUp() {
    this.getDistinctMonths();
    this.selectedRadio = "1";
    this.selectedYear = this.currentYear.toString();
    this.selectedQuarter = "Q" + this.currentQuarter;
    this.selectedMonth = this.currentMonth.toString();
    this.dialogRef1 = this.dialog.open(this.downloadReportPopup, {
      disableClose: true,
      width: '500px'
    });
  }

  getDistinctMonths() {
    const observer = {
      next: (data: string[]) => this.distinctMonths = data,
      error: (err: any) => console.error('Error fetching distinct months', err),
      complete: () => console.log('Fetching distinct months completed')
    };
    this.api.distinctMonths().subscribe(observer);
  }

  updateDaysInMonth(): void {
    this.daysInMonth = [];
    const date = new Date(this.selectedYear, this.selectedMonth, 0);
    const days = date.getDate();

    for (let i = 1; i <= days; i++) {
      this.daysInMonth.push(i);
    }

    this.generateExcel();
  }

  onYearMonthChange(): void {
    this.updateDaysInMonth();
  }

  generateExcel(): void {
    const ws_data = this.prepareDataForExcel();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    XLSX.writeFile(wb, `Attendance_${this.selectedYear}_${this.monthNames[this.selectedMonth]}.xlsx`);
  }

  prepareDataForExcel(): any[][] {
    const ws_data: any[][] = [];

    // Header row with dates
    const dateRow: string[] = ['Name', 'Manager ID', 'Shift'];
    const dayRow: string[] = ['', '', ''];
    for (let day of this.daysInMonth) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, day);
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      dateRow.push(formattedDate);
      dayRow.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    ws_data.push(dateRow);
    ws_data.push(dayRow);

    // Placeholder for user data (fetch and fill in actual data here)
    const exampleData = [
      { name: 'John Doe', managerId: 'M001', shift: 'Shift A', attendance: Array(this.daysInMonth.length).fill('Present') },
      { name: 'Jane Smith', managerId: 'M002', shift: 'Shift B', attendance: Array(this.daysInMonth.length).fill('Absent') }
    ];

    for (let user of exampleData) {
      const row = [user.name, user.managerId, user.shift, ...user.attendance];
      ws_data.push(row);
    }

    return ws_data;
  }

  downloadReport() {
    // this.loader.show();
    // if (this.selectedRadio == "1") {
    //   this.api.downloadMonthlyAdminReport(this.selectedMonth, this.selectedYear).subscribe({
    //     next: (response) => {
    //       if (response) {
    //         this.attendanceReportData = response;
    //         console.log(this.attendanceReportData)
    //         this.downloadMthReportSheet();
    //       }
    //       this.loader.hide();
    //     },
    //     error: (error) => {
    //       this.loader.hide();
    //     }
    //   });
    // } else if (this.selectedRadio == "2") {
    //   this.api.downloadQtrAdminReport(this.selectedQuarter, this.selectedYear).subscribe({
    //     next: (response) => {
    //       if (response) {
    //         this.attendanceReportData = response;
    //         console.log(this.attendanceReportData)
    //         this.downloadReportSheet();
    //       }
    //       this.loader.hide();
    //     },
    //     error: (error) => {
    //       this.loader.hide();
    //     }
    //   });
    // }
    this.updateDaysInMonth();
    this.dialogRef1.close();
  }

  downloadMthReportSheet() {
    const exportData = this.attendanceReportData.map((item: { year: any; month: any; name: any; emailId: any; wfh: any; wfo: any; wfhFriday: any; wfoFriday: any; leaves: any; holidays: any; }) => ({
      'Year': item.year,
      'Month': this.monthNames[item.month],
      'Name': item.name,
      'Email Id': item.emailId,
      'Work From Home': item.wfh,
      'Work From Office': item.wfo,
      'Work From Home - Friday': item.wfhFriday,
      'Work From Office - Friday': item.wfoFriday,
      'Leaves': item.leaves,
      'Public Holidays': item.holidays
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!autofilter'] = { ref: `A1:J${exportData.length + 1}` };

    const header = ['Year', 'Month', 'Name', 'Email Id', 'Work From Home', 'Work From Office', 'Work From Home - Friday', 'Work From Office - Friday',
      'Leaves', 'Public Holidays'];
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });

    ws['!cols'] = [
      { wch: 7 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 17 },
      { wch: 17 },
      { wch: 24 },
      { wch: 24 },
      { wch: 9 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, this.monthNames[this.selectedMonth] + '_' + this.selectedYear + '_' + "Attendance_Report");
  }

  downloadReportSheet() {
    const exportData = this.attendanceReportData.map((item: { year: any; quarter: any; name: any; emailId: any; wfh: any; wfo: any; wfhFriday: any; wfoFriday: any; leaves: any; holidays: any; }) => ({
      'Year': item.year,
      'Quarter': item.quarter,
      'Name': item.name,
      'Email Id': item.emailId,
      'Work From Home': item.wfh,
      'Work From Office': item.wfo,
      'Work From Home - Friday': item.wfhFriday,
      'Work From Office - Friday': item.wfoFriday,
      'Leaves': item.leaves,
      'Public Holidays': item.holidays
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!autofilter'] = { ref: `A1:J${exportData.length + 1}` };

    const header = ['Year', 'Quarter', 'Name', 'Email Id', 'Work From Home', 'Work From Office', 'Work From Home - Friday', 'Work From Office - Friday',
      'Leaves', 'Public Holidays'];
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });

    ws['!cols'] = [
      { wch: 7 },
      { wch: 9 },
      { wch: 25 },
      { wch: 20 },
      { wch: 17 },
      { wch: 17 },
      { wch: 24 },
      { wch: 24 },
      { wch: 9 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, this.selectedQuarter + '_' + this.selectedYear + '_' + "Attendance_Report");
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: this.EXCEL_TYPE });
    saveAs(data, fileName + this.EXCEL_EXTENSION);
  }
}