import experss from "express";

const PORT = 4000;

const app = experss();

const handleHome = (req, res) => {
  return res.send("wow");
};

const handleLogin = (req, res) => {
  return res.send("Login here.");
};

app.get("/", handleHome);

app.get("/login", handleLogin);

const handleListening = () =>
  console.log(`server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);
