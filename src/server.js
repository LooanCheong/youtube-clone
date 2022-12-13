import express from "express";

const PORT = 4000;

const app = express();

const logger = (req, res, next) => {
  console.log(`${req.method}  ${req.url}`);
  next();
};

const handleHome = (req, res, next) => {
  return res.send("wow");
};

app.get("/", logger, handleHome);

const handleListening = () =>
  console.log(`server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);
