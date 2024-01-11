export interface UserInterface {
  id: number;
  login: string;
  image: string;
  email: string;
  twoFactorAuthenticationSecret?: string,
  codeTfa?: number;
}
