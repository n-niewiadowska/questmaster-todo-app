import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", async (req, res) => {
  const session = req.app.locals.session;
  const { username, password } = req.body;

  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+.<>-]).{8,16}$/;

  if (!usernameRegex.test(username)) {
    return res.status(400).send({ 
      message: "Username should be 3-30 characters long and contain only alphanumeric characters." 
    });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).send({ 
      message: "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character." 
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await session.run(
      "MATCH (u:User { username: $username }) RETURN u",
      { username }
    );

    if (user.records.length > 0) {
      return res.status(400).send({ message: "User with this username already exists."});
    }

    await session.run(
      "CREATE (u:User { username: $username, password: $hashedPassword})",
      { username, hashedPassword }
    );

    res.cookie("user", username, { httpOnly: true, maxAge: 30 * 60 * 1000 });

    res.status(200).send({ message: "New user registered!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message});
  }
});

router.post("/login", async (req, res) => {
  const session = req.app.locals.session;
  const { username, password } = req.body;

  try {
    const result = await session.run(
      "MATCH (u:User { username: $username }) RETURN u",
      { username }
    );

    if (result.records.length === 0) {
      return res.status(404).send({ message: "This user doesn't exist." });
    }

    const user = result.records[0].get("u").properties;

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).send({ message: "Invalid password." });
    }

    res.cookie("user", username, { httpOnly: true, maxAge: 30 * 60 * 1000 });
    res.status(200).send({ message: "User logged in successfully!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.status(200).send({ message: "User logged out successfully." })
});

router.delete("/delete", async (req, res) => {
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