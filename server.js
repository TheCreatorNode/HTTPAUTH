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
    } else if (req === "GET" && path === "/profile") {
      const auth = headers["authorization"];

      if (!auth || !auth.startsWith("Bearer")) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Missing Authorization header" }));
        return;
      }

      const token = auth.split(" ")[1];
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
  .listen(3000);

// const http = require("http");
// const fs = require("fs");
// const crypto = require("crypto");

// const PORT = 3000;
// const USERS_FILE = "./users.json";

// // helper to read and write user data
// function readUsers() {
//   return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
// }

// function writeUsers(users) {
//   fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
// }

// // helper to hash passwords
// function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
//   const hashed = crypto
//     .pbkdf2Sync(password, salt, 1000, 64, "sha512")
//     .toString("hex");
//   return { salt, hashed };
// }

// // helper to verify password
// function verifyPassword(password, user) {
//   const hashed = crypto
//     .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
//     .toString("hex");
//   return hashed === user.hashed;
// }

// // helper to send JSON response
// function send(res, status, data) {
//   res.writeHead(status, { "Content-Type": "application/json" });
//   res.end(JSON.stringify(data));
// }

// // main server
// const server = http.createServer((req, res) => {
//   if (req.method === "POST" && req.url === "/signup") {
//     let body = "";
//     req.on("data", (chunk) => (body += chunk));
//     req.on("end", () => {
//       const { username, password } = JSON.parse(body);
//       if (!username || !password)
//         return send(res, 400, { error: "Missing fields" });

//       const users = readUsers();
//       if (users.find((u) => u.username === username)) {
//         return send(res, 400, { error: "User already exists" });
//       }

//       const { salt, hashed } = hashPassword(password);
//       const user = { username, salt, hashed };
//       users.push(user);
//       writeUsers(users);
//       send(res, 201, { message: "Signup successful!" });
//     });
//   } else if (req.method === "POST" && req.url === "/login") {
//     let body = "";
//     req.on("data", (chunk) => (body += chunk));
//     req.on("end", () => {
//       const { username, password } = JSON.parse(body);
//       const users = readUsers();
//       const user = users.find((u) => u.username === username);

//       if (!user || !verifyPassword(password, user)) {
//         return send(res, 401, { error: "Invalid credentials" });
//       }

//       const token = Math.random().toString(36).substring(2);
//       user.token = token;
//       writeUsers(users);
//       send(res, 200, { message: "Login successful", token });
//     });
//   } else if (req.method === "GET" && req.url === "/profile") {
//     const auth = req.headers["authorization"];
//     if (!auth || !auth.startsWith("Bearer ")) {
//       return send(res, 401, {
//         error: "Missing or invalid Authorization header",
//       });
//     }

//     const token = auth.split(" ")[1];
//     const users = readUsers();
//     const user = users.find((u) => u.token === token);

//     if (!user) return send(res, 403, { error: "Invalid token" });

//     send(res, 200, {
//       username: user.username,
//       message: "Welcome to your profile!",
//     });
//   } else {
//     send(res, 404, { error: "Route not found" });
//   }
// });

// server.listen(PORT, () =>
//   console.log(` Server running on http://localhost:${PORT}`)
// );
