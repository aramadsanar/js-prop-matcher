const chai = require("chai");
const sinonChai = require("sinon-chai");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const {
  validateAndChangePropsRecursively,
  validateAndChangePropsRecursivelyByMap,
} = require("../");

const expect = chai.expect;
const should = chai.should();

const {
  Types: { ObjectId },
} = require("mongoose");

chai.use(sinonChai);
chai.use(deepEqualInAnyOrder);
require("it-each")({ testPerIteration: true });

describe("prop matcher and placeholder value placer test", function () {
  it.each(
    [
      {
        title: "obj[key] value is not as promised in field",
        obj: {
          a: {
            b: 123,
          },
        },
        field: "b",
        type: "string",

        expectation: "data type not equal",
      },
      {
        title: "obj[key] is not an array",
        obj: {
          a: {
            b: {},
          },
        },
        field: "b",
        type: "array",

        expectation: "not an array",
      },
      {
        title: "obj[key] is not a date",
        obj: {
          a: {
            b: {},
          },
        },
        field: "b",
        type: "date",
        expectation: "not a date",
      },
    ],
    "should throw on %s",
    ["title"],
    function ({ obj, field, type, expectation }) {
      try {
        validateAndChangePropsRecursively(obj, field, type);
      } catch ({ message }) {
        expect(message).to.match(new RegExp(expectation, "ig"));
      }
    }
  );

  it.each(
    [
      {
        title: "should change all b fields with dummy value",
        obj: {
          a: {
            b: 123,
          },
          b: 456,
          c: {
            d: "haha",
            e: {
              f: 789,
              b: 1010,
            },
          },
          j: {
            b: 456,
            k: [],
          },
        },
        field: "b",
        type: "number",
        expectation: {
          a: {
            b: 0,
          },
          b: 0,
          c: {
            d: "haha",
            e: {
              f: 789,
              b: 0,
            },
          },
          j: {
            b: 0,
            k: [],
          },
        },
      },
      {
        title: 'should change all lists named "k" with empty array',
        obj: {
          a: {
            b: 123,
          },
          b: 456,
          c: {
            d: "haha",
            e: {
              f: 789,
              b: 1010,
            },
          },
          j: {
            b: 456,
            k: ["hahahihi"],
          },
        },
        field: "k",
        type: "array",
        expectation: {
          a: {
            b: 123,
          },
          b: 456,
          c: {
            d: "haha",
            e: {
              f: 789,
              b: 1010,
            },
          },
          j: {
            b: 456,
            k: [],
          },
        },
      },
      {
        title: 'should change all objects named "c" with empty object',
        obj: {
          a: {
            b: 123,
          },
          b: 456,
          c: {
            d: "haha",
            e: {
              f: 789,
              b: 1010,
            },
          },
          j: {
            c: {
              d: "123",
            },
            b: 456,
            k: ["hahahihi"],
          },
        },
        field: "c",
        type: "object",
        expectation: {
          a: {
            b: 123,
          },
          b: 456,
          c: {},
          j: {
            c: {},
            b: 456,
            k: ["hahahihi"],
          },
        },
      },
    ],
    "%s",
    ["title"],
    function ({ obj, field, type, expectation }) {
      let result = validateAndChangePropsRecursively(obj, field, type);

      expect(result).to.deep.equalInAnyOrder(expectation);
    }
  );

  it("should replace date with empty string", function () {
    let obj = {
      a: {
        b: 123,
      },
      b: 456,
      c: {
        d: "haha",
        e: {
          f: 789,
          b: 1010,
        },
      },
      j: {
        b: 456,
        k: new Date("January 1, 1970 00:00:00"),
      },
    };
    let result = validateAndChangePropsRecursively(obj, "k", "date");

    result.j.k = result.j.k.toString();
    let expectation = {
      a: {
        b: 123,
      },
      b: 456,
      c: {
        d: "haha",
        e: {
          f: 789,
          b: 1010,
        },
      },
      j: {
        b: 456,
        k: "",
      },
    };

    expect(result).to.deep.equalInAnyOrder(expectation);
  });

  it("should replace elements as listed in a map", function () {
    let obj = {
      a: {
        b: 123,
      },
      b: 456,
      c: {
        d: "haha",
        e: {
          f: 789,
          b: 1010,
        },
      },
      j: {
        b: 456,
        k: [
          {
            b: 123,
          },
          {
            b: 3848,
          },
          { b: 8888, g: "hahahihi" },
        ],
      },
    };

    let result = validateAndChangePropsRecursivelyByMap(obj, {
      b: "number",
      g: "string",
      c: "object",
    });

    expect(result).to.deep.equalInAnyOrder({
      a: {
        b: 0,
      },
      b: 0,
      c: {},
      j: {
        b: 0,
        k: [
          {
            b: 0,
          },
          {
            b: 0,
          },
          {
            b: 0,
            g: "",
          },
        ],
      },
    });
  });

  it("should replace elements with given key in an array", function () {
    let obj = {
      a: {
        b: 123,
      },
      b: 456,
      c: {
        d: "haha",
        e: {
          f: 789,
          b: 1010,
        },
      },
      j: {
        b: 456,
        k: [
          {
            b: 123,
          },
          {
            b: 3848,
          },
          { b: 8888, g: "hahahihi" },
        ],
      },
    };

    let result = validateAndChangePropsRecursively(obj, "b", "number");

    expect(result).to.deep.equalInAnyOrder({
      a: {
        b: 0,
      },
      b: 0,
      c: {
        d: "haha",
        e: {
          f: 789,
          b: 0,
        },
      },
      j: {
        b: 0,
        k: [
          {
            b: 0,
          },
          {
            b: 0,
          },
          {
            b: 0,
            g: "hahahihi",
          },
        ],
      },
    });
  });

  it("should replace objectids with string", function () {
    let obj = {
      a: {
        b: new ObjectId(),
      },
      b: new ObjectId(),
      c: {
        d: "haha",
        e: {
          f: 789,
          v: 1010,
        },
      },
      j: {
        v: 456,
        k: [
          {
            b: new ObjectId(),
          },
          {
            v: 3848,
          },
          { v: 8888, g: "hahahihi" },
        ],
      },
    };

    let result = validateAndChangePropsRecursively(obj, "b", "objectId");

    expect(result).to.deep.equalInAnyOrder({
      a: {
        b: "",
      },
      b: "",
      c: {
        d: "haha",
        e: {
          f: 789,
          v: 1010,
        },
      },
      j: {
        v: 456,
        k: [
          {
            b: "",
          },
          {
            v: 3848,
          },
          { v: 8888, g: "hahahihi" },
        ],
      },
    });
  });

  it("should throwobject-based type mismatch exception", function () {
    let obj = { k: new Date() };
    try {
      validateAndChangePropsRecursivelyByMap(obj, { k: "string" });
    } catch ({ message }) {
      expect(message).to.match(/mismatch/gi);
    }
  });
});
