import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from "@angular/core";
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { CookieService } from 'ngx-cookie-service';

interface PeriodicElement {
  opponent: string;
  date: Date;
  result: string;
  score: string;
}

interface matchHistoryObject {
  gameId: number;
  winnerLogin: string;
  loserLogin: string;
  winnerScore: number;
  loserScore: number;
  mode: string;
  created_at: Date;
}

let ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})

export class AccountComponent implements OnInit {

  displayedColumns: string[] = ['date', 'opponent', 'result', 'score'];
  dataSource = ELEMENT_DATA;
  mode: ProgressSpinnerMode = 'determinate';
  value_match_5 = 50;
  value_match_10 = 25;
  value_match_100 = 2.5;
  value_clean_5 = 25 ;
  value_clean_10 = 25 ;
  value_clean_100 = 25 ;
  value_win_5 = 75;
  value_win_10 = 75;
  value_win_100 = 75;
  userAvatarSrc: string | ArrayBuffer | null = '';

  constructor(private readonly _cookieService : CookieService,
              private readonly _httpClient: HttpClient) {}

  ngOnInit(): void {
    if (!this._cookieService.check('jwt_cookie')) {
      alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
      window.location.href = "http://localhost:4200";
      return ;
    }
    
    const jwt_token: string = this._cookieService.get('jwt_cookie');
    const option: {headers: HttpHeaders} = {headers:new HttpHeaders({'Authorization': `Bearer ${jwt_token}`})};
    this.getProfile(jwt_token, option);
  }

  public getProfile(jwt_token: string, option: { headers: HttpHeaders }): void {
    this.getProfileImage(jwt_token, option);
    this.getWinrate(jwt_token, option);
    this.getMatchHistory(jwt_token, option);
    this.getAchievements(jwt_token, option);
  }

  public getWinrate(jwt_token: string, option: { headers: HttpHeaders }): void {
    this._httpClient.get<number>('http://localhost:3000/user/getWinrate', option)
      .subscribe((data) => {
        let profileWinrate = document.querySelector("mat-list-item[role='listitem3']");
        if (profileWinrate) {
          profileWinrate.textContent = data.toString() + " %" ;
        }
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
  }

  public getProfileImage(jwt_token: string, option: { headers: HttpHeaders }): void {
    this._httpClient.get<{username : string, img : string}>('http://localhost:3000/user/profile', option)
      .subscribe((data) => {
        const profileImg = document.querySelector('img');
        let name: HTMLElement | null= document.querySelector("mat-list-item[role='listitem1']");
        if (profileImg)
          profileImg.src = data.img;
        if(name)
          name.innerText = data.username;
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
  }

  public getMatchHistory(jwt_token: string, option: { headers: HttpHeaders }) {
    this._httpClient.get<{ login: string }>('http://localhost:3000/user/getLogin', option).subscribe((login) => {
      this._httpClient.get<{ history: matchHistoryObject, opponent: string }[]>('http://localhost:3000/user/matchHistory', option)
      .subscribe((gameData: { history: matchHistoryObject, opponent: string }[]): void => {
        let newELEMENT_DATA: PeriodicElement[] = [];
        for (let game of gameData) {
          newELEMENT_DATA.push({
            opponent: game.opponent,
            date: game.history.created_at,
            result: this.getResult(login.login, game.history),
            score: this.getScore(login.login, game.history, 0) + '-' + this.getScore(login.login, game.history, 1),
          });
        }
        this.dataSource = newELEMENT_DATA;
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    }); 
  }

  public getScore(login: string, matchHistory: matchHistoryObject, id: number) {
    if ((login === matchHistory.winnerLogin && id == 0) || (login === matchHistory.loserLogin && id == 1)) {
      return matchHistory.winnerScore;
    }
    return matchHistory.loserScore;
  }

  public getResult(userLogin: string, matchHistory: matchHistoryObject) {
    if (userLogin === matchHistory.winnerLogin) {
      return 'Victory';
    }
    return 'Defeat';
  }

  public getAchievements(jwt_token: string, option: { headers: HttpHeaders }) {
    this._httpClient.get<{ gameAmount: number, cleanSheet: number, victoryAmount: number }>('http://localhost:3000/user/getAchievements', option)
    .subscribe((achievements) => {
      this.value_match_5 = achievements.gameAmount / 5 * 100;
      this.value_match_10 = achievements.gameAmount / 10 * 100;
      this.value_match_100 = achievements.gameAmount;
      this.value_clean_5 = achievements.cleanSheet / 5 * 100;
      this.value_clean_10 = achievements.cleanSheet / 10 * 100;
      this.value_clean_100 = achievements.cleanSheet;
      this.value_win_5 = achievements.victoryAmount / 5 * 100;
      this.value_win_10 = achievements.victoryAmount / 10 * 100;
      this.value_win_100 = achievements.victoryAmount;
    }, (error: any) => {
      window.location.href = "http://localhost:4200";
    });
  }


// Opens the file input dialog when the "Change Avatar" button is clicked.
openFileInput = () => {
  // Retrieve the file input element by its ID
  const fileInput = document.getElementById('imageInput') as HTMLInputElement | null;

  // Check if the file input element exists
  if (fileInput) {
    // Trigger a click event on the file input, prompting the user to select an image
    fileInput.click();

    // Add an event listener to handle the change event when a file is selected
    fileInput.addEventListener('change', this._uploadImage);
  }
};


/**
 * Handles the upload of a new profile image.
 * @param event
 */
private _uploadImage = (event: Event) => {
  const input = event.target as HTMLInputElement;

  // Check if a file has been selected
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    // Check if the file type is either jpg or png
    if (this.isImageFile(file)) {
      const reader = new FileReader();

      // When the file reading is complete
      reader.onload = (e) => {
        const jwt_token = this._cookieService.get('jwt_cookie');
        const option = {headers:new HttpHeaders({'Authorization': `Bearer ${jwt_token}`})};
        this.userAvatarSrc = e.target?.result as string;
        this._httpClient.post('http://localhost:3000/user/updateAvatar', {image: this.userAvatarSrc}, option).subscribe((): void => {}, (error: any) => {
          window.location.href = "http://localhost:4200";
        });
      };

      // Read the file as a data URL
      reader.readAsDataURL(file);
    } else {
      alert('Please choose an image in JPG or PNG format.');
    }
  } else {
    alert('Please choose an avatar.');
  }
};

/**
 * Checks if the given file is an image of type PNG or JPEG.
 * @param file The file to check.
 * @returns True if the file is a PNG or JPEG image, false otherwise.
 */
private isImageFile(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png'];
  return allowedTypes.includes(file.type);
}
}
