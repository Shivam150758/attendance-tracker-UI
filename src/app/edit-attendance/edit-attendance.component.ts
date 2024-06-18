import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { ApiCallingService } from 'src/service/API/api-calling.service';
import { LoaderService } from 'src/service/Loader/loader.service';
import { ThemePalette, provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-edit-attendance',
  templateUrl: './edit-attendance.component.html',
  styleUrl: './edit-attendance.component.css',
  providers: [provideNativeDateAdapter()]
})
export class EditAttendanceComponent {

  now!: moment.Moment;
  currentYear!: number;
  currentMonth: any;
  selectedYear: any;
  selectedMonth: any;
  distinctYears: string[] = [];
  distinctMonths: string[] = [];
  attendanceSuccess: boolean = false;
  time!: string;
  username: any;
  email: any;
  team: any;
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
  attendanceData: any;
  detailedAttendanceData: any;
  sortColumn: string = '';
  sortAscending: boolean = true;
  options: any[] = [];

  @ViewChild('editDialog')
  editDialog!: TemplateRef<any>;
  popUpDate: any;
  popUpAttendance: any;
  popUpShift: any;

  constructor(private api: ApiCallingService, private loader: LoaderService, private dialog: MatDialog) {
  }

  async ngOnInit() {
    this.loader.show();
    await this.getCurrentQuarterAndYear();
    await this.loadDistinctYears();
    await this.loadDistinctMonths();
    this.loader.hide();
    this.selectedYear = this.currentYear.toString();
    this.selectedMonth = this.currentMonth.toString();
    let userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.username = userData.name;
      this.email = userData.emailId;
      this.team = userData.team;
      this.openDetailedAttendance();
    }
  }

  getCurrentQuarterAndYear(): Promise<void> {
    return new Promise((resolve) => {
      this.now = moment.tz('Asia/Kolkata');
      this.currentYear = this.now.year();
      this.currentMonth = this.now.month() + 1;
      this.time = this.now.format("DD-MMMM-YYYY HH:mm:ss");
      resolve();
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

  loadDistinctMonths() {
    const observer = {
      next: (data: string[]) => this.distinctMonths = data,
      error: (err: any) => console.error('Error fetching distinct months', err),
      complete: () => console.log('Fetching distinct months completed')
    };
    this.api.distinctMonths().subscribe(observer);
  }

  openDetailedAttendance() {
    this.loader.show();
    let qtr;
    if (this.selectedMonth == 1 || this.selectedMonth == 2 || this.selectedMonth == 3) {
      qtr = 1;
    } else if (this.selectedMonth == 4 || this.selectedMonth == 5 || this.selectedMonth == 6) {
      qtr = 2;
    } else if (this.selectedMonth == 7 || this.selectedMonth == 8 || this.selectedMonth == 9) {
      qtr = 3;
    } else if (this.selectedMonth == 10 || this.selectedMonth == 11 || this.selectedMonth == 12) {
      qtr = 4;
    }
    this.api.getDetailedAttendance(this.email, this.currentYear.toString(), "Q" + qtr, this.selectedMonth).subscribe({
      next: (response) => {
        this.detailedAttendanceData = response;
        this.sortData('date')
        this.loader.hide();
      },
      error: (error) => {
        this.loader.hide();
      }
    });
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = true;
    }

    this.detailedAttendanceData.sort((a: { [x: string]: any; }, b: { [x: string]: any; }) => {
      let valueA = a[column];
      let valueB = b[column];

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
      }
      if (typeof valueB === 'string') {
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortAscending ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortAscending ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  openDialog(item: any): void {
    this.popUpDate = this.parseDateString(item.date);
    let week = this.getDayOfWeek(this.popUpDate);
    this.popUpAttendance = item.attendance;
    this.popUpShift = item.shift;
    if (week === 'Friday') {
      this.options = ['Work From Home - Friday', 'Work From Office - Friday', 'Leave', 'Public Holiday'];
    } else {
      this.options = ['Work From Office', 'Work From Home', 'Leave', 'Public Holiday']; // Correct assignment here
    }

    const dialogRef = this.dialog.open(this.editDialog, {
      width: '950px',
    });
  }


  saveDialog(data: any): void {
  }

  parseDateString(dateString: string): Date {
    const [day, month, year] = dateString.split('-');
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    return new Date(parseInt(year), monthIndex, parseInt(day));
  }

  getDayOfWeek(date: Date): string {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
  }

}
