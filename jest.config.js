/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/routes/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["./src/test/prisma-singleton.ts"],
};
