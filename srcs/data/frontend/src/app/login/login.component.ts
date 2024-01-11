import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {CookieService} from "ngx-cookie-service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private readonly _cookieService: CookieService) {
  }

  ngOnInit(): void {

    if (this._cookieService.check('jwt_cookie')) {
      window.location.href = "http://localhost:4200";
    } else {
      this.route.queryParams.subscribe(params => {
        const code = params['code'];
        this.http.post<{ jwt_token: string }>('http://localhost:3000/auth', {code})
            .subscribe((data: { jwt_token: string }) => {
              this.tfaAuth(data.jwt_token);
            }, (error: any): void => {
              window.location.href = "http://localhost:4200/";
            });
      });
    }
  }

  public tfaAuth(jwt_token: string) {
    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` })
    };
    this.http.get<string>('http://localhost:3000/user/getTfaStatus', options)
      .subscribe((tfaStatus: string): void => {
        this.tfaRequest(tfaStatus, jwt_token, options);
      }, (error: any): void => {
        window.location.href = "http://localhost:4200/";
      });
  }

  public tfaRequest(tfaStatus: string, jwt_token: string, options: { headers: HttpHeaders }) {
    if (tfaStatus) {
      this.http.get<unknown>('http://localhost:3000/auth/tfa', options)
        .subscribe(() => {
          this.router.navigate(['/tfa-login', {jwt_token: jwt_token}]).catch((error): void => {
              console.error(error);
          });
        }, (error: any): void => {
          window.location.href = "http://localhost:4200/";
        });
    }
    else {
      this._cookieService.set('jwt_cookie', jwt_token);
      window.location.href = "http://localhost:4200";
    }
  }
}