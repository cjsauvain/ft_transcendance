import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { AccountComponent } from './account/account.component';
import { SettingsComponent } from './settings/settings.component';
import { HomeComponent } from './home/home.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { GameComponent } from './game/game.component';
import { LoginComponent } from './login/login.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ChatComponent } from './chat/chat.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule} from '@angular/common/http';
import { TfaLoginComponent } from './tfa-login/tfa-login.component';
import { ErrorRoutingComponent } from './error-routing/error-routing.component';
import { FriendAccountComponent } from './friend-account/friend-account.component';

@NgModule({
  declarations: [
    AppComponent,
    AccountComponent,
    SettingsComponent,
    HomeComponent,
    NavBarComponent,
    GameComponent,
    LoginComponent,
    LeaderboardComponent,
    ChatComponent,
    TfaLoginComponent,
    ErrorRoutingComponent,
    FriendAccountComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
