/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.e2e.test.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
  coverageReporters: ["text"],
};
