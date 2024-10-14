
import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/authOptions"; // Adjust the path as necessary
// import { PrismaAdapter } from "@auth/prisma-adapter"
// import prisma from "../../../../lib/prisma";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   providers: [],
// })



 