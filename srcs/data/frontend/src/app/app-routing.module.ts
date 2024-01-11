import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { SettingsComponent } from './settings/settings.component';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { LoginComponent } from './login/login.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ChatComponent } from './chat/chat.component';
import { TfaLoginComponent } from "./tfa-login/tfa-login.component";
import { ErrorRoutingComponent } from './error-routing/error-routing.component';
import { FriendAccountComponent} from './friend-account/friend-account.component';

const routes: Routes = [
  { path: 'account', component: AccountComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', component: HomeComponent },
  { path: 'game', component: GameComponent },
  { path: 'login', component: LoginComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'tfa-login', component: TfaLoginComponent },
  { path: 'friend-account/:login', component: FriendAccountComponent },
  { path: '**', component: ErrorRoutingComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
