import {Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import User from "../types/user";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const session = req.app.locals.session;
  const user: User = req.body;

  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+.<>-]).{8,16}$/;

  if (!usernameRegex.test(user.username)) {
    return res.status(400).send({ 
      message: "Username should be 3-30 characters long and contain only alphanumeric characters." 
    });
  }

  if (!passwordRegex.test(user.password)) {
    return res.status(400).send({ 
      message: "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character." 
    });
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);

  try {
    const existingUser = await session.run(
      "MATCH (u:User { username: $username }) RETURN u",
      { username: user.username }
    );

    if (existingUser.records.length > 0) {
      return res.status(400).send({ message: "User with this username already exists."});
    }

    await session.run(
      "CREATE (u:User { username: $username, password: $hashedPassword})",
      { username: user.username, hashedPassword }
    );

    res.cookie("user", user.username, { httpOnly: true, maxAge: 30 * 60 * 1000 });

    res.status(200).send({ message: "New user registered!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message});
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const session = req.app.locals.session;
  const user: User = req.body;

  try {
    const result = await session.run(
      "MATCH (u:User { username: $username }) RETURN u",
      { username: user.username }
    );

    if (result.records.length === 0) {
      return res.status(404).send({ message: "This user doesn't exist." });
    }

    const loggedUser = result.records[0].get("u").properties;

    const isValidPassword = await bcrypt.compare(user.password, loggedUser.password);

    if (!isValidPassword) {
      return res.status(400).send({ message: "Invalid password." });
    }

    res.cookie("user", user.username, { httpOnly: true, maxAge: 30 * 60 * 1000 });
    res.status(200).send({ message: "User logged in successfully!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("user");
  res.status(200).send({ message: "User logged out successfully." })
});

router.delete("/delete", async (req: Request, res: Response) => {
  const session = req.app.locals.session;
  const username = req.cookies.user;

  if (!username) {
    return res.status(400).send({ message: "No username provided." });
  }

  try {
    await session.run(
      "MATCH (u:User { username: $username }) DETACH DELETE u",
      { username }
    );

    res.clearCookie("user");
    res.status(200).send({ message: "Account deleted successfully." });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

export default router;