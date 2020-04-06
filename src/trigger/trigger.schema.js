module.exports = {

  "definitions": {},
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://example.com/root.json",
  "type": "object",
  "title": "The Root Schema",
  "required": [
    "data",
    "params",
    "serviceID"
  ],
  "properties": {
    "data": {},
    "params": {
      "$id": "#/properties/params",
      "type": "string",
      "title": "The Params Schema",
      "default": "",
      "examples": [
        "asdf"
      ],
      "pattern": "^(.*)$"
    },
    "serviceID": {
      "$id": "#/properties/serviceID",
      "type": "string",
      "title": "The Serviceid Schema",
      "default": "",
      "examples": [
        "b0faf9f0-2490-11ea-b0ba-63ba70ede8aa"
      ],
      "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    }
  }

}