import { Authenticator } from '@fastify/passport';
import type { FastifyInstance } from 'fastify';
import type { Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GitHubStrategy } from 'passport-github2';
import type { Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { findOrCreateOAuthUser } from '../auth/oauth.js';
import { config } from '../config.js';
import type { Container } from '../container.js';
import type { User } from '../domain/user/User.js';

const fastifyPassport = new Authenticator();

export async function registerPassportPlugin(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());

  fastifyPassport.registerUserSerializer(async (user: User) => user.id);
  fastifyPassport.registerUserDeserializer(async (id: string) => {
    const user = await container.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });

  if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
    fastifyPassport.use(
      'github',
      new GitHubStrategy(
        {
          clientID: config.GITHUB_CLIENT_ID,
          clientSecret: config.GITHUB_CLIENT_SECRET,
          callbackURL: '/auth/github/callback',
          scope: ['user:email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: GitHubProfile,
          done: (error: Error | null, user?: User) => void,
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            const user = await findOrCreateOAuthUser(
              'github',
              profile.id,
              {
                ...(email ? { email } : {}),
                ...(profile.username ? { username: profile.username } : {}),
                ...(profile.displayName ? { displayName: profile.displayName } : {}),
              },
              container,
            );
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
  }

  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    fastifyPassport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          callbackURL: '/auth/google/callback',
          scope: ['profile', 'email'],
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: GoogleProfile,
          done: (error: Error | null, user?: User) => void,
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            const user = await findOrCreateOAuthUser(
              'google',
              profile.id,
              {
                ...(email ? { email } : {}),
                ...(profile.displayName ? { username: profile.displayName } : {}),
                ...(profile.displayName ? { displayName: profile.displayName } : {}),
              },
              container,
            );
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
  }
}

export function registerOAuthRoutes(app: FastifyInstance): void {
  if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
    app.get(
      '/auth/github',
      { preValidation: fastifyPassport.authenticate('github') },
      async () => {},
    );

    app.get(
      '/auth/github/callback',
      {
        preValidation: fastifyPassport.authenticate('github', {
          failureRedirect: '/login?error=oauth_failed',
        }),
      },
      async (request, reply) => {
        const user = request.user as User;
        request.session.userId = user.id;
        return reply.redirect('/?login=success');
      },
    );
  }

  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    app.get(
      '/auth/google',
      { preValidation: fastifyPassport.authenticate('google') },
      async () => {},
    );

    app.get(
      '/auth/google/callback',
      {
        preValidation: fastifyPassport.authenticate('google', {
          failureRedirect: '/login?error=oauth_failed',
        }),
      },
      async (request, reply) => {
        const user = request.user as User;
        request.session.userId = user.id;
        return reply.redirect('/?login=success');
      },
    );
  }
}
