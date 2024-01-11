import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from "@angular/core";
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

interface PeriodicElement {
  opponent: string;
  date: Date;
  result: string;
  score: string;
}

interface matchHistoryObject {
  gameId: number;
  winnerUsername: string;
  loserUsername: string;
  winnerScore: number;
  loserScore: number;
  mode: string;
  created_at: Date;
}

let ELEMENT_DATA: PeriodicElement[] = [];

@Component({
  selector: 'app-friend-account',
  templateUrl: './friend-account.component.html',
  styleUrls: ['./friend-account.component.scss'],
})

export class FriendAccountComponent implements OnInit {

  displayedColumns: string[] = ['date', 'opponent', 'result', 'score'];
  dataSource = ELEMENT_DATA;
  mode: ProgressSpinnerMode = 'determinate';
  value = 50;
  userAvatarSrc: string | ArrayBuffer | null = '';

  constructor(private readonly _cookieService : CookieService,
              private readonly _httpClient: HttpClient,
              private readonly _route: ActivatedRoute) {}

  ngOnInit(): void {
    const login: string = this._route.snapshot.params['login'];
    const jwt_token: string = this._cookieService.get('jwt_cookie');
    this.getProfile(jwt_token, login);
  }

  public getProfile(jwt_token: string, login: string): void {
    this.getProfileImage(jwt_token, login);
    this.getWinrate(jwt_token, login);
  }

  public getWinrate(jwt_token: string, login: string): void {
    const option: {headers: HttpHeaders} = {headers:new HttpHeaders({'Authorization': `Bearer ${jwt_token}`})};
    this._httpClient.get<number>(`http://localhost:3000/user/getFriendWinrate?login=${login}`, option)
      .subscribe((data) => {
        let profileWinrate = document.querySelector("mat-list-item[role='listitem3']");
        if (profileWinrate) {
          profileWinrate.textContent = data.toString() + " %" ;
        }
      }, (error: any) => {
        window.location.href = "http://localhost:4200";
      });
  }

  public getProfileImage(jwt_token: string, login: string) {
    const option: {headers: HttpHeaders} = {headers:new HttpHeaders({'Authorization': `Bearer ${jwt_token}`})};
    this._httpClient.get<{username : string, img : string}>(`http://localhost:3000/user/friendProfile?login=${login}`, option)
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

  public getMatchHistory() {
    const jwt_token = this._cookieService.get('jwt_cookie');
    const option: {headers: HttpHeaders} = {headers:new HttpHeaders({'Authorization': `Bearer ${jwt_token}`})};

    this._httpClient.get<string>('http://localhost:3000/user/getUsername', option)
      .subscribe((login) => {
        this._httpClient.get<matchHistoryObject[]>('http://localhost:3000/user/matchHistory', option)
        .subscribe((matchHistory: matchHistoryObject[]): void => {
          let newELEMENT_DATA: PeriodicElement[] = [];
          for (let match of matchHistory) {
            const opponent = this.getOpponent(login, match);
            newELEMENT_DATA.push({
              opponent: opponent,
              date: match.created_at,
              result: this.getResult(login, match),
              score: this.getScore(login, match) + '-' + this.getScore(opponent, match),
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

  public getOpponent(userLogin: string, matchHistory: matchHistoryObject) {
    if (userLogin === matchHistory.winnerUsername) {
      return matchHistory.loserUsername;
    }
    return matchHistory.winnerUsername;
  }

  public getScore(login: string, matchHistory: matchHistoryObject) {
    if (login === matchHistory.winnerUsername) {
      return matchHistory.winnerScore;
    }
    return matchHistory.loserScore;
  }

  public getResult(userLogin: string, matchHistory: matchHistoryObject) {
    if (userLogin === matchHistory.winnerUsername) {
      return 'Victory';
    }
    return 'Defeat';
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
        this._httpClient.post('http://localhost:3000/user/updateAvatar', {image: this.userAvatarSrc}, option).subscribe((error: any) => {
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
