import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import { resolvers } from "./graphql/resolvers/resolvers.js";
import upload from "./routes/multer.js";
import { uploadPicture } from "./graphql/resolvers/mutation/resource.js";

const PORT = 9000;
const typeDefs = await readFile("./app/graphql/schema.graphql", "utf8");

const app = express();
app.use(cors(), express.json());
app.use("/static", express.static("public"));

const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();
app.use("/graphql", apolloMiddleware(apolloServer));

//UPLOAD FILE
app.post("/upload/:id", upload.single("picture"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  await uploadPicture({ picPath: req.file.filename, id: req.body.id });

  res.json({ message: "File uploaded successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
