const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

function readFile() {
  return JSON.parse(fs.readFileSync("user.json", "utf-8"));
}

function verifyPassword(password, user) {
  const hashed = crypto.scryptSync(password, user.salt, 64).toString("hex");
  console.log(hashed);
  return hashed === user.hashed;
}
// verifyPassword("bright", null);

const server = http
  .createServer((req, res) => {
    const { method, url, headers } = req;
    const fullURL = new URL(url, `http://${headers.host}`);
    const path = fullURL.pathname;
    console.log(path);
    let usersData;

    if (method === "POST" && path === "/signup") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        const { username, password } = JSON.parse(body);

        if (!username && !password) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "Missing fields" }));
          return;
        }

        usersData = readFile();
        if (usersData.find((u) => u.username === username)) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "users already exists" }));
          return;
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const hashed = crypto.scrypt(password, salt, 64).toString("hex");

        const user = { username, salt, hashed };
        usersData.push(user);

        fs.writeFileSync("user.json", JSON.stringify(usersData, null, 2));

        res.writeHead(201, { "content-type": "application/json" });
        res.end(JSON.stringify({ Message: "Signup successful" }));
      });
    } else if (method === "POST" && path === "/login") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        const { username, password } = JSON.parse(body);
        usersData = readFile();
        const user = usersData.find((u) => u.username === username);

        if (!user || !verifyPassword(password, user)) {
          res.writeHead(401, { "content-type": "application/json" });
          res.end(JSON.stringify({ Error: "invalid credentials" }));
          return;
        }

        const token = Math.random().toString(36).substring(2);
        console.log(`token : ${token}`);
        user.token = token;
        console.log(user);
        fs.writeFileSync("user.json", JSON.stringify(usersData, null, 2));

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ Message: "Login successful", token }));
      });
    } else if (method === "GET" && path === "/profile") {
      const auth = headers["authorization"];

      if (!auth || !auth.startsWith("Bearer")) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Missing Authorization header" }));
        return;
      }

      const token = auth.split(" ")[1];
      console.log(token);
      usersData = readFile();
      const user = usersData.find((u) => (u.token = token));

      if (!user) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid Token" }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Welcome!!! to your profile" }));
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Route not found" }));
    }
  })
  .listen(3000, () => console.log(` Server running on http://localhost:3000`));
