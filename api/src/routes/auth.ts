import { FastifyInstance } from "fastify";
import { loginSchema, resendSchema, signupSchema } from "../schemas/auth";
import * as userService from "../services/userService";
import * as verificationService from "../services/verificationService";
import { sendVerificationEmail } from "../services/emailService";
import { signAccessToken } from "../auth/jwt";
import { authGuard } from "../auth/guard";
import { forbidden, unauthorized } from "../errors";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Create an account and send a verification email. Public.
  app.post("/auth/signup", async (request, reply) => {
    const { email, password } = signupSchema.parse(request.body);
    const user = await userService.createUser(email, password);
    const token = await verificationService.issueToken(user.id);
    await sendVerificationEmail(user.email, token);
    reply.code(201);
    return {
      message:
        "Account created. Please check your email to verify your account.",
    };
  });

  // Verify an email via a single-use token. Public.
  app.get("/auth/verify", async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) {
      reply.code(400);
      return { status: "invalid" as const };
    }
    const result = await verificationService.consumeToken(token);
    if (result !== "verified") {
      reply.code(400);
    }
    return { status: result };
  });

  // Resend a verification email for an unverified account. Public.
  // Responds the same whether or not the account exists, to avoid leaking
  // which emails are registered.
  app.post("/auth/resend-verification", async (request) => {
    const { email } = resendSchema.parse(request.body);
    const user = await userService.findByEmail(email);
    if (user && !user.isVerified) {
      const token = await verificationService.issueToken(user.id);
      await sendVerificationEmail(user.email, token);
    }
    return {
      message:
        "If an unverified account exists for that email, a new verification email has been sent.",
    };
  });

  // Exchange verified credentials for a bearer token. Public.
  app.post("/auth/login", async (request) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await userService.verifyCredentials(email, password);
    if (!user) {
      throw unauthorized("Invalid email or password", "invalid_credentials");
    }
    if (!user.isVerified) {
      throw forbidden(
        "Please verify your email before logging in",
        "email_not_verified",
      );
    }
    const token = signAccessToken(user.id);
    return { token, user: { id: user.id, email: user.email } };
  });

  // Current authenticated user. Protected.
  app.get("/me", { preHandler: authGuard }, async (request) => {
    return { user: request.user };
  });
}
