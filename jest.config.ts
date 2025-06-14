
export default {
  projects: [
    {
        displayName: 'unit',
        testMatch: ['<rootDir>/src/**/*.spec.ts'],
        testEnvironment: 'node',
        moduleFileExtensions: ['js', 'json', 'ts'],
        transform: {
            '^.+\\.(t|j)s$': 'ts-jest',
        },
        moduleNameMapper: {
            "^@/(.*)$": "<rootDir>/src/$1"
        }
    },
    {
        displayName: 'e2e',
        testEnvironment: "node",
        testRegex: "./e2e/.*\\.e2e-spec\\.ts$",
        transform: {
            "^.+\\.(t|j)s$": "ts-jest"
        },
        setupFilesAfterEnv: ["<rootDir>/test/utils/global-e2e-setup.ts"],
        moduleNameMapper: {
            "^@/(.*)$": "<rootDir>/src/$1",
            '^@test/(.*)$': '<rootDir>/test/$1'
        }
    },
  ],
};
