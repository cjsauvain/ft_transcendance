import { Component, OnInit } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

const AMOUNT_OF_PLAYERS_IN_LEADERBOARD: number = 5;

interface userObject {
  username: string,
  winrate: number,
  image: string,
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  public items: {
    name: string,
    winrate: number,
    img: string,
  }[] = [];

  constructor(private readonly _cookieService: CookieService,
              private readonly _httpClient: HttpClient) {}

  public ngOnInit(): void {
    const jwt_token: string = this._cookieService.get('jwt_cookie');
    this._getTopFive(jwt_token);
  }

  private _getTopFive(jwt_token: string): void {
    const option: { headers: HttpHeaders } = { headers: new HttpHeaders({ 'Authorization': `Bearer ${jwt_token}` }) };
    this._httpClient.get<userObject[]>('http://localhost:3000/user/getAllUsers', option)
      .subscribe((users: userObject[]): void => {
        // sort the winrate by descending order so that highest winrate is first and lowest winrate is last`
        users = users.sort((a: userObject, b: userObject) => b.winrate - a.winrate);
        // only keep the AMOUNT_OF_PLAYERS_IN_LEADERBOARD first values
        users = users.slice(0, AMOUNT_OF_PLAYERS_IN_LEADERBOARD);
        // transfer the needed properties inside the local items variable
        for (let user of users) {
          this.items.push({
            name: user.username,
            winrate: user.winrate,
            img: user.image,
          })
        }
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
  }
}
