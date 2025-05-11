import "@fastify/jwt";

/** Що саме ми хочемо мати у request.user */
export interface IUserJWT {
  _id: string;
  id?: string;
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: IUserJWT;
  }
}
