import Ajv from "ajv";
import { z } from "zod";

export const jsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0 },
  },
  required: ["name", "age"],
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: false, strict: false });
export const ajvValidate = ajv.compile(jsonSchema);

export const zodSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

export const greet = ({ name, age }) => ({
  greeting: `Hello ${name}, age ${age}`,
});
