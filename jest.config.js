module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "globals" : {
    "ts-jest": {
      "packageJson": "package.json"
    }
  },
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "reporters": ["default", "jest-junit"]
}
