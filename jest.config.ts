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
    },
    {
        displayName: 'e2e',
        testEnvironment: "node",
        testRegex: "./e2e/.*\\.e2e-spec\\.ts$",
        transform: {
            "^.+\\.(t|j)s$": "ts-jest"
        },
        // setupFiles: ["<rootDir>/test/utils/env-for-e2e.ts"],
        setupFilesAfterEnv: ["<rootDir>/test/utils/global-e2e-setup.ts"],
        moduleNameMapper: {
            "^@/(.*)$": "<rootDir>/src/$1"
        }
    },
  ],
};
