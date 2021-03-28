if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

if (global.btoa == undefined || globalThis.atob == undefined) {
  global.btoa = (str) => {
    return Buffer.from(str, "latin1").toString("base64");
  };
  global.atob = (b64Encoded) => {
    return Buffer.from(b64Encoded, "base64");
  };
}

function getBytes(b64Encoded) {
  return new Buffer.from(b64Encoded, "base64");
}

/**
 *
 * @param {string} input
 * @returns string base64 encoded string
 */
function dcg_encode(input) {
  var encodedString = "DCG";

  return encodedString;
}

/**
 *
 * @param {string} input base64 encoded string
 * @returns string
 */
function dcg_decode(input) {
  if (input.startsWith("DCG") == false) {
    console.log("Decode failed, bad format");
    return "";
  }

  const data = input.substr(3);
  const bData = atob(data);
  const bufferSize = bData.length;
  console.log(atob(data));

  var bytePos = 0;
  const nextByte = (offset = 1) => {
    bytePos += offset;
  };
  const getByte = () => bData[bytePos]; //bData.charCodeAt(bytePos);
  const getString = (length) =>
    bData.slice(bytePos, bytePos + length).toString("latin1");

  var byte = getByte();
  const version = (byte & 240) >> 4;
  const eggCount = byte & 15;

  console.log(
    bytePos,
    "version",
    version,
    "eggCount",
    eggCount,
    byte.toString(2).padStart(8, "0")
  );

  nextByte();
  byte = getByte();
  const checksum = byte;
  console.log(bytePos, "checksum", checksum, byte.toString(2).padStart(8, "0"));

  nextByte();
  byte = getByte();
  const nameLength = byte;

  console.log(
    bytePos,
    "nameLength",
    nameLength,
    byte.toString(2).padStart(8, "0")
  );

  var totalCards = 0;
  const readCard = () => {
    nextByte();
    //const set = bData.substr(bytePos, 4).trim();
    const set = getString(4).trim();
    console.log(bytePos, "set", set);

    nextByte(4);
    var byte = getByte();
    const padding = ((byte & 192) >> 6) + 1;
    const count = byte & 63;

    console.log(
      bytePos,
      "padding",
      padding,
      "count",
      count,
      byte.toString(2).padStart(8, "0")
    );

    const getValueWithCarry = (offsetValue, written) => {
      nextByte();
      byte = getByte();
      const carry = byte & 128;
      const value = byte & 127;
      const newValue = (value << written) & offsetValue;
      if (carry) {
        return getValueWithCarry(newValue, written + 7);
      }
      return newValue;
    };

    var setCardOffset = 0;
    for (var i = 0; i < count; i++) {
      nextByte();
      byte = getByte();
      const cardcount = ((byte & 192) >> 6) + 1;
      const parallel = (byte & 56) >> 3;
      const offsetCarry = byte & 4;
      var offset = byte & 3;
      if (offsetCarry) {
        offset = getValueWithCarry(offset, 2);
      }
      setCardOffset += offset;
      totalCards += cardcount;
      console.log(
        bytePos,
        "cc",
        cardcount,
        "pa",
        parallel,
        "offset",
        offset,
        `${set}-${setCardOffset.toString().padStart(padding, "0")}`,
        byte.toString(2).padStart(8, "0")
      );
    }
  };
  for (var i = 0; i < eggCount; i++) {
    readCard();
  }
  totalCards = 0;
  while (totalCards < 49) {
    readCard();
    console.log(totalCards);
  }

  for (var i = 0; i < 20; i++) {
    console.log(i, bData[i].toString(2).padStart(8, "0"));
  }
}

dcg_decode(
  "DCGAVQdU1QxIEHBU1QxIE7CwcHBwUHBwUFBwcHBQlNUMiBBRwNTdGFydGVyIERlY2ssIEdhaWEgUmVkIFtTVC0xXQ__"
);
