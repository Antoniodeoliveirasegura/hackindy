import { APIError } from "better-auth/api";
import { auth } from "../auth.mjs";

const email = "antonio.plays1212@gmail.com";
const password = "password";
const name = "Antonio";

try {
  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  console.log("Seeded test user:", result.user?.email || email);
} catch (error) {
  if (error instanceof APIError && error.status === 422) {
    console.log("Test user already exists:", email);
    process.exit(0);
  }

  if (error instanceof Error && /exist|already/i.test(error.message)) {
    console.log("Test user already exists:", email);
    process.exit(0);
  }

  console.error(error);
  process.exit(1);
}
