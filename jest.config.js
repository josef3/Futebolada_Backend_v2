module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/'],
    collectCoverage: true,
    coverageReporters: ["json", "html"],
    // collectCoverageFrom: ['./**/*.ts'],
    // setupFilesAfterEnv: ['./jest.setup.js']
}