import express from "express";
import Category from "../enums/category";
import State from "../enums/state";
const router = express.Router();

router.post("/new", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const { title, dueTo, category, description } = req.body;
  const defaultQuestState = State.CURRENT;

  if (!user) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  if (title === "" || title.length > 30 || !Object.values(Category).includes(category)) {
    return res.status(400).send({ message: "Invalid quest title or category." });
  }

  const timestamp = Date.parse(dueTo);

  if (isNaN(timestamp) || new Date(timestamp) < new Date()) {
    return res.status(400).send({ message: "Invalid due date" });
  }

  try {
    const questResult = await session.run(
      "MATCH (q:Quest { title: $title }) RETURN q",
      { title }
    );

    if (questResult.records.length > 0) {
      return res.status(400).send({ message: "You already created a quest with this title." });
    }

    await session.run(
      `MATCH (u:User { username: $user }), (c:Category { name: $category })
      MERGE (u) - [:CREATED_QUEST] -> (q:Quest { title: $title, dueTo: $dueTo, description: $description, state: $defaultQuestState })
      MERGE (q) - [:FROM_CATEGORY] -> (c)`,
      { title, dueTo, description, defaultQuestState, user, category }
    );

    res.status(200).send({ message: "Quest created successfully!"});
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// GET all or by category
router.get("/", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const category = req.query.category;

  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
  }

  try {
    let result;

    if (category) {
      result = await session.run(
        `MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) - [:FROM_CATEGORY] -> (c:Category { name: $category })
        RETURN id(q) as id, q, c`,
        { user, category }
      );
    } else {
      result = await session.run(
        `MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) - [:FROM_CATEGORY] -> (c:Category) 
        RETURN id(q) as id, q, c`,
        { user }
      );
    }

    const quests = result.records.map((record: any) => ({
      id: record.get("id").toNumber(),
      ...record.get("q").properties,
      category: record.get("c").properties.name
    }));

    res.status(200).json(quests);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// GET quest by id
router.get("/:id", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const id = parseInt(req.params.id);

  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const result = await session.run(
      `MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) - [:FROM_CATEGORY] -> (c:Category) 
      WHERE id(q) = $id 
      RETURN  id(q) as id, q, c`,
      { user, id }
    );

    if (result.records.length === 0) {
      return res.status(404).send({ message: "Quest not found" });
    }

    const record = result.records[0];
    const quest = {
      id: record.get("id").toNumber(),
      ...record.get("q").properties,
      category: record.get("c").properties.name
    } 

    res.status(200).json(quest);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.put("/edit/:id", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const id = parseInt(req.params.id);
  const { title, dueTo, description, category } = req.body;
  const query = [];

  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
  }

  if (title) {
    query.push("q.title = $title");
  }

  if (dueTo) {
    const timestamp = Date.parse(dueTo);

    if (isNaN(timestamp) || new Date(timestamp) < new Date()) {
      return res.status(400).send({ message: "Invalid due date" });
    }

    query.push("q.dueTo = $dueTo");
  }

  if (description) {
    query.push("q.description = $description");
  }

  if (category && !Object.values(Category).includes(category)) {
    return res.status(400).send({ message: "Wrong category." });
  }

  try {
    const updates = query.join(", ");

    const questResult = await session.run(
      `MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) WHERE id(q) = $id 
      SET ${updates}
      RETURN q`,
      { user, id, title, dueTo, description }
    );

    if (questResult.records.length === 0) {
      return res.status(400).send({ message: "Quest not found" });
    }

    if (category) {
      await session.run(
        `MATCH (q:Quest) WHERE id(q) = $id
        OPTIONAL MATCH (q) - [r:FROM_CATEGORY] -> (:Category)
        DELETE r
        WITH q
        MATCH (c:Category { name: $category })
        MERGE (q) - [:FROM_CATEGORY] -> (c)`,
        { id, category }
      );
    }

    res.status(200).send({ message: "Quest updated!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.put("/done/:id", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const id = parseInt(req.params.id);
  const finishedState = State.DONE;

  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const result = await session.run(
      `MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) WHERE id(q) = $id
      SET q.state = $finishedState
      RETURN q`,
      { user, id, finishedState }
    );

    if (result.records.length === 0) {
      return res.status(404).send({ message: "Quest not found" });
    }

    res.status(200).send({ message: "Quest finished!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const session = req.app.locals.session;
  const user = req.cookies.user;
  const id = parseInt(req.params.id);

  if (!user) {
    res.status(401).send({ message: "Unauthorized" });
  }

  try {
    await session.run(
      "MATCH (:User { username: $user }) - [:CREATED_QUEST] -> (q:Quest) WHERE id(q) = $id DETACH DELETE q",
      { user, id }
    );

    res.status(200).send({ message: "Quest deleted!" });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

export default router;