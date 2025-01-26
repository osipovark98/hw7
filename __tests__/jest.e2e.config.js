module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["../out"],
  testRegex: ".e2e.ts$",
};
