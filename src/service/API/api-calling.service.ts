import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiCallingService {

  private loginUrl = 'http://localhost:8080/login';
  private markAttendance = 'http://localhost:8080/addAttendance';
  private qtrLevelAttendance = 'http://localhost:8080/addUserAttendance';
  private userLevelAttendance = 'http://localhost:8080/getUserAttendance';
  private detailedAttendance = 'http://localhost:8080/detailedAttendance';
  private detailedAttendanceQtr = 'http://localhost:8080/detailedAttendanceQtr';
  private attendanceCategory = 'http://localhost:8080/attendanceCategory';
  private allUsers = 'http://localhost:8080/allUsers';
  private downloadQtrAttendace = 'http://localhost:8080/adminQtrReport';
  private downloadMthAttendace = 'http://localhost:8080/adminMthReport';
  private distinctYears = 'http://localhost:8080/distinctYears';
  private distinctQtr = 'http://localhost:8080/distinctQuarters';
  private distinctMonth = 'http://localhost:8080/distinctMonths';
  private adminMonthlyAttendance = 'http://localhost:8080/addMonthlyAttendance';
  private resetPassword = 'http://localhost:8080/resetPassword';
  private userMonthlyAttendance = 'http://localhost:8080/userMonthlyAttendance';
  private subOrdinatesList = 'http://localhost:8080/subordinates';
  private requestList = 'http://localhost:8080/requestApproval';
  private sendRequest = 'http://localhost:8080/saveForApproval';
  private updateAttendance = 'http://localhost:8080/updateAttendance';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.loginUrl, { emailId: email, password: password });
  }

  reset(email: string, password: string): Observable<any> {
    return this.http.post(this.resetPassword, { emailId: email, password: password });
  }

  attendance(Id: string, email: string, date: string, atte: string, year: string, qtr: string, mth: string, lub: string, luo: string, shift: string): Observable<any> {
    return this.http.post(this.markAttendance, { id: Id + date, emailId: email, date: date, attendance: atte, year: year, quarter: qtr, month: mth, shift: shift, lastUpdatedBy: lub, lastUpdatedOn: luo });
  }

  addUserAttendance(Id: string, email: string, attendance: string, year: string, quarter: string, name: string): Observable<any> {
    return this.http.post(this.qtrLevelAttendance, { id: Id + quarter + year, emailId: email, qtr: quarter, year: year, attendance: attendance, name: name });
  }

  getUserAttendance(Id: string, year: string, quarter: string): Observable<any> {
    return this.http.post(this.userLevelAttendance, { id: Id + quarter + year });
  }

  getDetailedAttendance(email: string, year: string, qtr: string, month: string): Observable<any> {
    return this.http.post(this.detailedAttendance, { emailId: email, month: month, quarter: qtr, year: year });
  }

  getDetailedAttendanceQtr(email: string, year: string, qtr: string): Observable<any> {
    return this.http.post(this.detailedAttendanceQtr, { emailId: email, quarter: qtr, year: year });
  }

  getCategoryAttendance(email: string, qtr: string, year: string, attendance: string): Observable<any> {
    return this.http.post(this.attendanceCategory, { emailId: email, quarter: qtr, year: year, attendance: attendance });
  }

  getAllUsers() {
    return this.http.get(this.allUsers);
  }

  downloadQtrAdminReport(qtr: string, year: string) {
    return this.http.post(this.downloadQtrAttendace, { quarter: qtr, year: year });
  }

  downloadMonthlyAdminReport(month: string, year: string) {
    return this.http.post(this.downloadMthAttendace, { month: month, year: year });
  }

  distinctYear(): Observable<string[]> {
    return this.http.get<string[]>(this.distinctYears);
  }

  distinctQuarter(): Observable<string[]> {
    return this.http.get<string[]>(this.distinctQtr);
  }

  distinctMonths(): Observable<string[]> {
    return this.http.get<string[]>(this.distinctMonth);
  }

  addMonthlyAttendance(Id: string, email: string, attendance: string, year: string, quarter: string, name: string, month: string): Observable<any> {
    return this.http.post(this.adminMonthlyAttendance, { id: Id + quarter + year + "_" + month, emailId: email, quarter: quarter, year: year, attendance: attendance, name: name, month: month });
  }

  userMonthlyAttendanceData(email: string, year: string, quarter: string, month: string): Observable<any> {
    return this.http.post(this.userMonthlyAttendance, { id: email + quarter + year + "_" + month, emailId: email });
  }

  getListofSubOrdinates(email: string) {
    return this.http.post(this.subOrdinatesList, { emailId: email });
  }

  getApprovalList(email: string) {
    return this.http.post(this.requestList, { raisedBy: email, raisedTo: email })
  }

  sendForApproval(data: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(this.sendRequest, {
      name: data.name,
      comments: data.comments,
      date: data.date,
      month: data.month,
      newAttendance: data.newAttendance,
      newShift: data.newShift,
      prevAttendance: data.prevAttendance,
      prevShift: data.prevShift,
      quarter: data.quarter,
      raisedBy: data.raisedBy,
      raisedTo: data.raisedTo,
      status: data.status,
      type: data.type,
      year: data.year
    }, { headers, responseType: 'text' as 'json' });
  }

  updateAttendanceApproval(data: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log(data)
    return this.http.post(this.updateAttendance, {
      id: data._id,
      name: data.name,
      comments: data.comments,
      date: data.date,
      month: data.month,
      newAttendance: data.newAttendance,
      newShift: data.newShift,
      prevAttendance: data.prevAttendance,
      prevShift: data.prevShift,
      quarter: data.quarter,
      raisedBy: data.raisedBy,
      raisedTo: data.raisedTo,
      status: data.status,
      type: data.type,
      year: data.year
    }, { headers, responseType: 'text' as 'json' });
  }
}
