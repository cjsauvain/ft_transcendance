import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {CookieService} from "ngx-cookie-service";
import {_MatSlideToggleRequiredValidatorModule} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit{

  isChecked = false;
  newName: string = '';

  constructor(private readonly http: HttpClient,
    private readonly _cookieService: CookieService) {
  }

  public ngOnInit(): void {
    if (!this._cookieService.check('jwt_cookie')) {
      alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
      window.location.href = "http://localhost:4200";
      return ;
    }

    const jwt_token = this._cookieService.get('jwt_cookie');
    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` }),
    };

    this.http.get(`http://localhost:3000/user/getTfaStatus`, options).subscribe((status) => {
      this.isChecked = status as boolean;
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    });
  }

  public async setTfaStatus(status: boolean): Promise<void> {
    const jwt_token = this._cookieService.get('jwt_cookie');
    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` })
    };

    this.http.get(`http://localhost:3000/user/setTfaStatus?TfaStatus=${status}`, options).subscribe(() => {
      if (status === true) {
        alert("Two-Factor Authentication activated");
      }
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    });
  } 

  public changeName(): void {
    const jwt_token = this._cookieService.get('jwt_cookie');
    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` })
    };

    this.http.get(`http://localhost:3000/user/updateUsername?newUsername=${this.newName}`, options).subscribe((result) => {
      if (result === 1) {
        alert("Error Username already exists");
      } else if (result === 2) {
        alert("Username must contain between 3 and 10 characters");
      }else if (result === 3) {
        alert("Username successfully changed");
      }
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    });
  }
}


