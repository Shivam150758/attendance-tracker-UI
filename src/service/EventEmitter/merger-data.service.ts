interface AttendanceReport {
    emailId: string;
    name: string;
    year: string;
    quarter: string;
    wfh: number;
    wfo: number;
    wfhFriday: number;
    wfoFriday: number;
    leaves: number;
    holidays: number;
}

interface User {
    emailId: string;
    name: string;
    team: string;
    lastLogin: Date;
}

interface MergedData extends AttendanceReport, User { }

function mergeData(attendanceReportData: AttendanceReport[], users: User[]): MergedData[] {
    const mergedArray: MergedData[] = [];

    users.forEach(user => {
        const report = attendanceReportData.find(report => report.emailId === user.emailId);
        if (report) {
            mergedArray.push({ ...user, ...report });
        }
    });

    return mergedArray;
}