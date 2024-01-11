import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-tfa-login',
  templateUrl: './tfa-login.component.html',
  styleUrls: ['./tfa-login.component.scss']
})

export class TfaLoginComponent implements OnInit {
  constructor(
    private readonly http: HttpClient,
    private readonly cookieService: CookieService,
    private readonly route: ActivatedRoute) {}

    ngOnInit(): void {
      alert("Please check your emails to enter the code");
    }

  public verifyTfa(userInput: string): void {
    const jwt_token: string | null = this.route.snapshot.paramMap.get('jwt_token');

    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` })
    };
    this.http.get<boolean>(`http://localhost:3000/auth/verify-tfa?userInput=${userInput}`, options).subscribe((result) => {
      if (result && jwt_token) {
        this.cookieService.set('jwt_cookie', jwt_token);
        window.location.href = "http://localhost:4200";
      } else {
        alert("Bad authentication");
      }
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    });
  }
}
