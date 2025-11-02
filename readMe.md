Title: “HTTP Auth Challenge”
Goal: learn headers, authorization, and password hashing (no libs).

Routes

POST /signup → { username, password } (store hashed password manually using crypto)

POST /login → check credentials, return fake token (Math.random().toString(36))

GET /profile → must include header Authorization: Bearer <token>

Store data in users.json.
