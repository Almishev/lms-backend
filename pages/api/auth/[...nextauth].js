import NextAuth, {getServerSession} from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import {MongoDBAdapter} from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import {mongooseConnect} from "@/lib/mongoose";
import {Admin} from "@/models/Admin";

export const authOptions = {
  secret: process.env.SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      authorization: {
        params: {
          scope: 'public_profile email'
        }
      },
      profile(profile) {
        // Нормализиране на Facebook профила към NextAuth полета
        // Email ще е наличен само ако потребителят има валиден email и е дал разрешение
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email ?? null,
          image: profile.picture?.data?.url ?? null,
        }
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', user.email, account?.provider);
      // За Facebook понякога няма email -> откажи достъпа ако няма email, защото админ логиката разчита на него
      if (account?.provider === 'facebook' && !user?.email) {
        console.warn('Facebook sign-in blocked: missing email permission');
        return false;
      }
      return true;
    },
    async session({ session, token, user }) {
      console.log('Session callback - User email:', session?.user?.email);
      
      try {
        await mongooseConnect();
        
        // Проверяваме дали user-ът е в admins колекцията
        const adminEmails = await Admin.find().select('email');
        const adminEmailList = adminEmails.map(admin => admin.email);
        
        console.log('Admin emails from DB:', adminEmailList);
        console.log('Is admin:', adminEmailList.includes(session?.user?.email));
        
        if (adminEmailList.includes(session?.user?.email)) {
          console.log('User is admin, allowing access');
          return session;
        } else {
          console.log('User is not admin, denying access');
          return false;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
  debug: true,
};

export default NextAuth(authOptions);

export async function isAdminRequest(req,res) {
  const session = await getServerSession(req,res,authOptions);
  
  try {
    await mongooseConnect();
    const adminEmails = await Admin.find().select('email');
    const adminEmailList = adminEmails.map(admin => admin.email);
    
    if (!adminEmailList.includes(session?.user?.email)) {
      res.status(401);
      res.end();
      throw 'not an admin';
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(401);
    res.end();
    throw 'not an admin';
  }
}
