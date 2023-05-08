const {
  Types: { ObjectId },
} = require("mongoose");

const EXEMPTED_TYPE_VALUES = ["array", "date", "objectId"];
const DEFAULT_PLACEHOLDER_VALUE = {
  number: 0,
  string: "",
  array: [],
  date: "",
  object: {},
  boolean: false,
  objectId: "",
};

function validateAndChangePropsRecursivelyByMap(obj, map) {
  obj = { ...obj };
  for (let key in map) {
    obj = {
      ...validateAndChangePropsRecursively(obj, key, map[key]),
    };
  }

  return obj;
}

function validateAndChangePropsRecursively(obj, field, type) {
  obj = { ...obj };

  if (
    EXEMPTED_TYPE_VALUES.indexOf(type) == -1 &&
    typeof DEFAULT_PLACEHOLDER_VALUE[type] !== type
  ) {
    throw new Error("replacement val is not same as field data type");
  }

  for (let key in obj) {
    if (key === field) {
      obj[key] = validateAndChangeMatchingProp(obj[key], type);
    }
    if (isPlainObject(obj[key])) {
      obj[key] = validateAndChangePropsRecursively(obj[key], field, type);
    } else {
      if (Array.isArray(obj[key])) {
        obj[key] = validateAndChangePropsRecursivelyInArray(
          obj[key],
          field,
          type
        );
      }
    }
  }

  return obj;
}

function isPlainObject(obj) {
  if (
    // eslint-disable-next-line
    typeof obj === "object" &&
    obj !== null
  ) {
    const proto = Reflect.getPrototypeOf(obj);

    return proto === Object.prototype || proto === null;
  }

  return false;
}

function validateAndChangePropsRecursivelyInArray(objList, field, type) {
  objList = objList.map((elm) => {
    if (ObjectId && ObjectId.isValid(elm))
      return DEFAULT_PLACEHOLDER_VALUE["objectId"];
    if (isPlainObject(elm))
      return validateAndChangePropsRecursively(elm, field, type);

    return elm;
  });

  return objList;
}

function validateAndChangeMatchingProp(matchingProp, type) {
  let dataType = typeof matchingProp;
  if (dataType === type && dataType !== "object") {
    return DEFAULT_PLACEHOLDER_VALUE[type];
  } else if (dataType === "object") {
    return validateAndChangeMatchingObject(matchingProp, type);
  } else {
    throw new Error("data type not equal");
  }
}

function validateAndChangeMatchingObject(matchingProp, type) {
  switch (type) {
    case "date": {
      return validateAndChangeMatchingDate(matchingProp);
    }
    case "array": {
      return validateAndChangeMatchingArray(matchingProp);
    }
    case "object": {
      return validateAndChangeMatchingPlainObject(matchingProp);
    }
    case "objectId": {
      return validateAndChangeMatchingObjectId(matchingProp);
    }
    default: {
      if (EXEMPTED_TYPE_VALUES.indexOf(type) !== -1) {
        throw new Error(
          "Mismatch between object-based property and type specified"
        );
      }

      return matchingProp;
    }
  }
}

function validateAndChangeMatchingDate(matchingProp) {
  let isDate = matchingProp instanceof Date;
  if (isDate) {
    matchingProp = DEFAULT_PLACEHOLDER_VALUE["date"];
  } else {
    throw new Error("not a date");
  }

  return matchingProp;
}

function validateAndChangeMatchingArray(matchingProp) {
  let isArray = Array.isArray(matchingProp);
  if (isArray) {
    matchingProp = DEFAULT_PLACEHOLDER_VALUE["array"];
  } else {
    throw new Error("not an array");
  }

  return matchingProp;
}

function validateAndChangeMatchingPlainObject(matchingProp) {
  if (isPlainObject(matchingProp)) {
    matchingProp = DEFAULT_PLACEHOLDER_VALUE["object"];
  } else {
    throw new Error("not a plain object");
  }

  return matchingProp;
}

function validateAndChangeMatchingObjectId(matchingProp) {
  if (ObjectId && ObjectId.isValid(matchingProp)) {
    matchingProp = DEFAULT_PLACEHOLDER_VALUE["objectId"];
  } else {
    throw new Error("not a valid ObjectId or ObjectId not passed");
  }

  return matchingProp;
}

module.exports = {
  validateAndChangePropsRecursively,
  validateAndChangePropsRecursivelyByMap,
};
