// hash.js
const bcrypt = require("bcryptjs");

const plainPassword = "admin123"; // 🔁 Change to your new password

bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) throw err;
  console.log("Hashed password:", hash);
});
