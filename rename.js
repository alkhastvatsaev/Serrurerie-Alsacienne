const fs = require("fs");
const path = require("path");

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          if (
            !file.includes("node_modules") &&
            !file.includes(".git") &&
            !file.includes(".next")
          ) {
            walk(file, (err, res) => {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            if (!--pending) done(null, results);
          }
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const replacements = [
  { regex: /SERRURE OS/g, replacement: "Serrurerie Alsacienne OS" },
  { regex: /Serrure OS/g, replacement: "Serrurerie Alsacienne OS" },
  { regex: /SERRURE Strasbourg/g, replacement: "Serrurerie Alsacienne" },
  { regex: /SERRURE PRO™/g, replacement: "Serrurerie Alsacienne PRO™" },
  { regex: /annuaire SERRURE/g, replacement: "annuaire Serrurerie Alsacienne" },
  {
    regex: /SERRURE Intelligence/g,
    replacement: "Intelligence Serrurerie Alsacienne",
  },
  { regex: /serrure-strasbourg\.fr/g, replacement: "serrurerie-alsacienne.fr" },
  { regex: /smartlock-manager/g, replacement: "serrurerie-alsacienne" },
  { regex: /smartlock-elite\.fr/g, replacement: "serrurerie-alsacienne.fr" },
  {
    regex: /demo_vatsaev_serrure/g,
    replacement: "demo_vatsaev_serrurerie_alsacienne",
  },
  {
    regex: /SerrureApp-Admin-Dashboard/g,
    replacement: "SerrurerieAlsacienne-Admin-Dashboard",
  },
  { regex: /SERRURE/g, replacement: "Serrurerie Alsacienne" }, // Be careful not to replace general 'serrure' usage
];

walk(__dirname, (err, files) => {
  if (err) throw err;
  files.forEach((file) => {
    if (
      file.endsWith(".ts") ||
      file.endsWith(".tsx") ||
      file.endsWith(".md") ||
      file.endsWith(".json") ||
      file.endsWith(".command")
    ) {
      let content = fs.readFileSync(file, "utf8");
      let originalContent = content;

      // Skip package-lock.json to avoid corruption, we can run npm i later
      if (file.includes("package-lock.json")) return;

      replacements.forEach(({ regex, replacement }) => {
        // Because SERRURE catches everything, let's make sure we only match it exactly
        if (regex.source === "SERRURE") {
          // Only match exact word SERRURE
          content = content.replace(/\bSERRURE\b/g, "Serrurerie Alsacienne");
        } else {
          content = content.replace(regex, replacement);
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(file, content, "utf8");
        console.log("Updated: " + file);
      }
    }
  });
});
