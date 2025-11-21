import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth"; 
import { ObjectId } from "mongodb";

// Extend NextAuth session to include the 'id' field
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Custom adapter to add timestamps
const customMongoDBAdapter = {
  ...MongoDBAdapter(clientPromise),
  createUser: async (userData: any) => {
    const client = await clientPromise;
    const db = client.db("blockpulse");

    // Add timestamps to the user data
    const userWithTimestamp = {
      ...userData,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const result = await db.collection("users").insertOne(userWithTimestamp);
    return {
      id: result.insertedId.toString(),
      ...userWithTimestamp,
    };
  },
  updateUser: async (userData: any) => {
    const client = await clientPromise;
    const db = client.db("blockpulse");

    // Add updated timestamp
    const userWithTimestamp = {
      ...userData,
      lastLoginAt: new Date(),
    };

    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: userData.id },
        { $set: userWithTimestamp },
        { returnDocument: "after" }
      );

    return result.value;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customMongoDBAdapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const client = await clientPromise;
        const db = client.db("blockpulse");
        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Update the last login timestamp
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use the string value directly
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string; // Add 'id' to session user
      }
      return session;
    },
  },
  events: {
    // Add the timestamp on sign in for OAuth providers
    async signIn({ user }) {
      if (!user || !user.id) return;

      const client = await clientPromise;
      const db = client.db("blockpulse");

      const existinguser = await db.collection("users").findOneAndUpdate(
        { _id: new ObjectId(user.id) }, // convert string to ObjectId
        { $set: { lastLoginAt: new Date() } },
        { returnDocument: "after" } // optional: returns updated document
      );

      // console.log("Checking user:", existinguser);
      // New users are handled by the custom adapter's createUser method
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
