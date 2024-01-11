import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ViewChild } from '@angular/core';
import { WrappedSocket } from "ngx-socket-io/src/socket-io.service";
import { ChatWebsocketService } from "../services/chat-websocket.service";
import { NgForm } from '@angular/forms';
import { GameEventService } from "../services/game-event.service";
import { Router } from "@angular/router";
import { ChatEventService } from '../services/chat-event.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

interface message {
    target_name: string;
    message: string;
    inviting_name: string;
    room: string;
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})

export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('form') form!: NgForm;

    private _socket: WrappedSocket;
    public showGeneral: boolean = true;
    public isUserOnline: boolean = false;
    public isInviteUsersModal: boolean = false;
    public isGameOptModal: boolean = false;
    public isUserMenu: boolean = false;
    public username: string = '';
    public messagetest: message[] = [];
    public message: string = '';
    public userList: string[] = [];
    public isFriend: boolean = false;
    public friendList: {
        id: number,
        sender: string
        receiver: string,
    }[] = [];
    public blockedList: string[] = [];
    public targetId: string = '';
    public targetRoom: string = '';
    public isFriendStatus: boolean = false;
    public isBlockedStatus: boolean = false;
    public selectedPrivateMessages: { username: string; message: string }[] = [];

    constructor(private webSocketService: ChatWebsocketService, private location: Location,
        private readonly _router: Router,
        private readonly _gameEventService: GameEventService,
        private readonly _chatEventService: ChatEventService,
        private readonly _cookieService: CookieService,
        private readonly _httpClient: HttpClient,
        ) {
            this._socket = this.webSocketService.getSocket();
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
                this.setUsername(storedUsername);
            }
            this._socket.on('username', (username: string) => {
                this.setUsername(username);
        });
    }

    public ngOnInit() {
        if (!this._cookieService.check('jwt_cookie')) {
            alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
            window.location.href = "http://localhost:4200";
        }

        this._socket.connect();
        /**
         * Listening to the response containing the list of all active users 
         */
        this._socket.on('getUserList', (payload: string[]): void => {
            this.userList = payload;
        });
        /**
         * Listening to the response containing the list of all friends
         */
        this._socket.on('getFriendList', (data: {id: number, sender: string, receiver: string}[]): void => {
            this.friendList = data;
            this.friendList.forEach((element) => {
                this.getFriendStatus(element.receiver)
              });
            // on connection, targetId is not initialized yet so no need to check friendship
            if (this.targetId) {
                this.isFriend = this._isTargetFriend();
            }        
        });

        //BLOCK

        this._socket.on('infoBlocked', (payload: boolean): void => {
            if (payload === true) {
                this._socket.emit('removeBlocked', this.targetId);
            }
            else if (payload === false) {
                this._socket.emit('addBlocked', this.targetId);
            }
            else {
                return;
            }
        });
        this._socket.on('isBlockedRemoved', (payload: boolean): void => {
            if (payload === true)
                this.blockedList = this.blockedList.filter(user => user !== this.targetId);
        });
        this._socket.on('isBlockedAdded', (payload: boolean): void => {
            if (payload === true)
                this.blockedList.push(this.targetId);
        });

        //END BLOCK

        this._socket.on('message', (payload: message): void => {
            const messagetoPush: message = {
                target_name: payload.target_name,
                message: payload.message,
                inviting_name: payload.inviting_name,
                room: payload.room,
            }
            this.messagetest.push(messagetoPush)
        });
        this._socket.on('getMessageOn', (payload: message[]): void => {
            payload.forEach(payload => {
                const messagetoPush: message = {
                    target_name: payload.target_name,
                    message: payload.message,
                    inviting_name: payload.inviting_name,
                    room: payload.room,
                }
                this.messagetest.push(messagetoPush)
            })
        });
        this._socket.on('setStatus', (payload: "Online" | "Offline"): void => {
            this.isUserOnline = payload === "Online" ? true : false
        });
    }

    ngOnDestroy(): void {
        this._socket.disconnect();
        this._socket.removeAllListeners();
    }

    public sendMessage() {
        if (this.message && this.message.trim() !== '') {
            this._socket.emit('createMessage', { name: this.username, text: this.message, target: this.targetId });
        }
        this.message = '';
    }

    public chatHomepage() {
        this.location.back();
    }

    public setUsername(username: string) {
        this.username = username;
        localStorage.setItem('username', username);
    }

    public checkIfDisplayable(room: string): boolean {
        const tmp = [this.username, this.targetId];
        tmp.sort();
        const concat = tmp[0] + tmp[1];
        if (concat === room) {
            return (true);
        }
        return (false);
    }

    public privateMessageScreen() {
        this.showGeneral = false;
        this.isUserMenu = false;
        const tmp = [this.username, this.targetId];
        tmp.sort();
        const concat = tmp[0] + tmp[1];
        this._socket.emit('getPrevMessages', concat);
    }

    public chatGeneral(): void {
        this.showGeneral = true;
        this.messagetest = [];
    }

    public closeGameOptModal(): void {
        this.isGameOptModal = false;
    }

    public normalMode(): void {
        const mode: "Normal" = "Normal";

        this._router.navigate(['/game'])
            .then((): void => {
                this._gameEventService.inviteToPrivateGame(this.targetId, mode);
            }).catch((error): void => {
                console.error(error);
            })
    }

    public shrinkMode(): void {
        const mode: "Shrink" = "Shrink";

        this._router.navigate(['/game'])
            .then((): void => {
                this._gameEventService.inviteToPrivateGame(this.targetId, mode);
            }).catch((error): void => {
                console.error(error);
            })
    }

    public getFriendStatus(friend: string): void {
        const jwt_token: string = this._cookieService.get('jwt_cookie');
        const option: { headers: HttpHeaders } = { headers: new HttpHeaders({ 'Authorization': `Bearer ${jwt_token}` }) };
        this._httpClient.get<{status: "Online" | "Offline"}>(`http://localhost:3000/user/getUserStatus?friend=${friend}`, option)
            .subscribe((status: {status: "Online" | "Offline"}): void => {
                this.isUserOnline = (status.status === "Online" ? true : false);
            });
            setTimeout(() => {
            }, 2000);
    }

    public selectTargetUser(target: string): void {
        this.targetId = target;
        this.isFriend = this._isTargetFriend();
    }

    private _isTargetFriend(): boolean {
        if (this.friendList.length === 0) {
            return (false);
        }
        if (this.friendList.find(friend => friend.receiver === this.targetId) !== undefined) {
            return (true);
        } 
        return (false);
    }

    public openInviteUsersModal(): void {
        this.isInviteUsersModal = true;
    }

    public requestAllUsers(): void {
        this._socket.emit('getUserList');
    }

    public closeInviteUsersModal(): void {
        this.isInviteUsersModal = false;
    }

    public openUserMenu(): void {
        this.isInviteUsersModal = false;
        this.isUserMenu = true;
    }

    public closeUserMenu(): void {
        this.isUserMenu = false;
        this.isInviteUsersModal = true;
    }

    public inviteToPlay(): void {
        this.isGameOptModal = true;
        this.isUserMenu = false;
    }

    public viewProfile(): void {
        this._router.navigate([`./friend-account/${this.targetId}`]).catch((error): void => {
            console.error(error);
        })
    }

    public addFriend(): void {
        this._chatEventService.addFriend(this.targetId);
    }

    public deleteFriend(): void {
        this._chatEventService.deleteFriend(this.targetId);
    }

    public addBlocked(): void {
        this._socket.emit('isBlocked');
        this.isBlockedStatus = true;
    }

    public deleteBlocked(): void {
        this._socket.emit('isBlocked');
        this.isBlockedStatus = false;
    }
}
