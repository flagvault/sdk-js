import { getMessage } from "../src/index";

test('getMessage returns "Hello world!"', () => {
  expect(getMessage()).toBe("Hello world!");
});
