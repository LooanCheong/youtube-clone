import experss from "express";

const app = experss();

const handleListening = () => console.log("server listening on port 4000");

app.listen(4000, handleListening);
