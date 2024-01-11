import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from "unique-names-generator";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public async getAccessToken(code: string) {
    const options = {
      grant_type: 'authorization_code',
      client_id:
	  	process.env.APP_UID,
      client_secret:
	  	process.env.APP_SECRET,
      code: code,
      redirect_uri: 'http://localhost:4200/login',
    };
    const response = await axios
      .post('https://api.intra.42.fr/oauth/token', options)
      .catch(function (error) {
        throw error;
      });
    return response.data.access_token;
  }

  public async getUserInfos(code: string) {
    const access_token = await this.getAccessToken(code);
    const config = {
      headers: { Authorization: `Bearer ${access_token}` },
    };
    let randomName: string = this._createRandomUsername();
    while (randomName.length > 10) {
      randomName = this._createRandomUsername();
    }

    const response = await axios
      .get('https://api.intra.42.fr/v2/me', config)
      .catch(function (error) {
        throw error;
      });
    return {
      id: response.data.id,
      login: response.data.login,
      username: randomName,
      image: response.data.image.versions.large,
      email: response.data.email,
    };
  }

  public async login(code: string): Promise<string> {
    const userData = await this.getUserInfos(code);
    let user: User | null = await this.userService.findOneByName(userData.login);

    if (user === null) {
      user = await this.userService.createUser(userData);
    }
    const payload = { sub: user.id, username: user.login, email: user.email };
    return await this.jwtService.signAsync(payload);
  }

  /**
   * Generate a random username
   * Adjectives dictionary contains 1,400 words
   * Animals dictionary contains 350 words
   * Each combination has a probability of 1 / 1400 * 350, i.e 1 / 490,000
   * @private
   */
  private _createRandomUsername(): string {
    const generatorCustomConfig: Config = {
      dictionaries: [adjectives, animals],
      separator: '_',
      length: 2,
    }
    return (uniqueNamesGenerator(generatorCustomConfig));
  }
}
