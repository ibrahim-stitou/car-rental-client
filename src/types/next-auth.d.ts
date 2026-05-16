import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: {
        id: number;
        name: string;
        description: string;
      };
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: {
      id: number;
      name: string;
      description: string;
    };
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: {
      id: number;
      name: string;
      description: string;
    };
    accessToken: string;
  }
}