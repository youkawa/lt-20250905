import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/?(*.)+(spec).ts'],
  moduleNameMapper: {
    '^prom-client$': '<rootDir>/src/metrics/prom-client.stub.ts',
  },
};

export default config;
