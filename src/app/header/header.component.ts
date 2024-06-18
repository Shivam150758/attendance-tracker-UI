import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService } from 'src/service/Loader/loader.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  username: any
  team: any


  @Input() title: string = 'Digital GBS Attendance Tracker';

  constructor(private route: Router, private loader: LoaderService) {

  }

  ngOnInit() {
    let userDataString = sessionStorage.getItem('user');
    if (userDataString) {
      let userData = JSON.parse(userDataString);
      this.username = userData.name;
      this.team = userData.team;
    } else {
      console.log("No user data found in sessionStorage.");
    }
  }

  logOut() {
    this.loader.show();
    sessionStorage.removeItem('auth');
    this.route.navigateByUrl('/');
    setTimeout(() => {
      this.loader.hide();
    }, 2000);
  }
}
