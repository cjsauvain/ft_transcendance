import { Router} from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Component, OnDestroy, OnInit } from "@angular/core";
import { WrappedSocket } from 'ngx-socket-io/src/socket-io.service';
import { VerifyAuthWebsocketService } from "../services/verify-auth-websocket.service";
import { UserListService } from "../services/user-list.service";
import { Subscription } from "rxjs";
import Swal from "sweetalert2";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {environment} from "../../environment/environment.prod";

const enum ValueInIndex {
  INVITER = 0,
  MODE = 1,
}

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})

export class NavBarComponent implements OnInit, OnDestroy  {
  public isLoggedIn: boolean = false;

  private readonly _socket: WrappedSocket;
  private _privateInvitationSubscription!: Subscription;

  constructor(private _router: Router,
              private cookieService: CookieService,
              private readonly _cookieService: CookieService,
              private readonly _websocket: VerifyAuthWebsocketService,
              private readonly _userListService: UserListService,
              private readonly _http: HttpClient) {
      this._socket = this._websocket.getSocket();
  }

  public ngOnInit(): void {
    const isCookie: boolean = this._cookieService.check("jwt_cookie");
    if (isCookie) {
      this.verifyAuth().catch((error): void => {
        console.error(error);
        return ;
      });
      this._userListService.addSocket(this._socket);

      this._privateInvitationSubscription = this._userListService.hasReceivedInvitation()
      .subscribe((data: [inviter: string, mode: "Normal" | "Shrink"]): void => {
        Swal.fire({
          title: 'New challenge!',
          text: `${data[ValueInIndex.INVITER]} challenged you to play a ${data[ValueInIndex.MODE]} game`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Accept',
          cancelButtonText: 'Decline',
        }).then((result): void => {
          if (result.isConfirmed) {
            this._router.navigate(['']).then((): void => {
              this._router.navigate(['/game'], { state: { private: true } }).catch((error): void => {
                console.error(error);
              });
            }).catch((error): void => {
              console.error(error);
            });
          } else if (result.isDismissed) {
            this._userListService.declinePrivateGame();
          }
        })
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
    }
  }

  public ngOnDestroy(): void {
    this._privateInvitationSubscription.unsubscribe();
  }

  public async request(): Promise<void> {
    return (new Promise((resolve, reject) => {
      this._socket.emit('verify_auth', (response: boolean): void => {
        if (response) {
          resolve ();
        } else {
          this.onClickDisconnect();
          reject();
        }
      });
    }));
  }

  public async verifyAuth(): Promise<void> {
    try {
      await this.request();
      this.isLoggedIn = true;
    } catch (error) {
    this.isLoggedIn = false;
    }
  }

  public onClickSettings(): void {
    const isCookie: boolean = this._cookieService.check("jwt_cookie");
    if (isCookie) {
      this._router.navigate(['/settings']).catch((error): void => {
        console.error(error);
      });
    } else {
      alert('You must be logged in to access this page. You will be redirected to the home page');
      window.location.href = 'http://localhost:4200';
    }
  }

  public onClickAccount(): void {
    const jwt_token: string = this._cookieService.get("jwt_cookie");
    if (jwt_token) {
      this._router.navigate([`/account/`]);
    } else {
      alert('You must be logged in to access this page. You will be redirected to the home page');
      window.location.href = 'http://localhost:4200';
    }
  }

  public onClickHome(): void {
    this._router.navigate(['']);
  }

  public onClickLeaderBoard(): void {
    const isCookie: boolean = this._cookieService.check("jwt_cookie");
    if (isCookie) {
      this._router.navigate(['/leaderboard']);
    } else {
      alert('You must be logged in to access this page. You will be redirected to the home page');
      window.location.href = 'http://localhost:4200';
    }
  }

  public onClickGame(): void {
    const isCookie: boolean = this._cookieService.check("jwt_cookie");
    if (isCookie) {
      this._router.navigate(['/game']);
    } else {
      alert('You must be logged in to access this page. You will be redirected to the home page');
      window.location.href = 'http://localhost:4200';
    }
  }

  public onClickChat(): void {
    const isCookie: boolean = this._cookieService.check("jwt_cookie");
    if (isCookie) {
      this._router.navigate(['/chat']);
    } else {
      alert('You must be logged in to access this page. You will be redirected to the home page');
      window.location.href = 'http://localhost:4200';
    }
  }

  public onClickLogin(): void {
    window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${environment.APP_UID}&redirect_uri=http://localhost:4200/login&response_type=code`;
  }

  public onClickDisconnect(): void {
    const jwt_token = this.cookieService.get('jwt_cookie');
    const options = {
      headers: new HttpHeaders({ Authorization: `Bearer ${jwt_token}` })
    };
    this._http.post('http://localhost:3000/user/setOnlineStatus', { status: false}, options).subscribe(() => {
      this.cookieService.delete('jwt_cookie');
      this.isLoggedIn = false;
      window.location.href = "http://localhost:4200";
    });
  }
}
