if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
// Marshals a string to an Uint8Array.
function encodeUTF8(s) {
  var i = 0,
    bytes = new Uint8Array(s.length * 4);
  for (var ci = 0; ci != s.length; ci++) {
    var c = s.charCodeAt(ci);
    if (c < 128) {
      bytes[i++] = c;
      continue;
    }
    if (c < 2048) {
      bytes[i++] = (c >> 6) | 192;
    } else {
      if (c > 0xd7ff && c < 0xdc00) {
        if (++ci >= s.length)
          throw new Error("UTF-8 encode: incomplete surrogate pair");
        var c2 = s.charCodeAt(ci);
        if (c2 < 0xdc00 || c2 > 0xdfff)
          throw new Error(
            "UTF-8 encode: second surrogate character 0x" +
              c2.toString(16) +
              " at index " +
              ci +
              " out of range"
          );
        c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
        bytes[i++] = (c >> 18) | 240;
        bytes[i++] = ((c >> 12) & 63) | 128;
      } else bytes[i++] = (c >> 12) | 224;
      bytes[i++] = ((c >> 6) & 63) | 128;
    }
    bytes[i++] = (c & 63) | 128;
  }
  return bytes.subarray(0, i);
}

// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */

function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
}

//https://gist.github.com/lihnux/2aa4a6f5a9170974f6aa
// 한 -> ED 95 9C
function toUTF8Array(str) {
  let utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode =
        0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

// if (global.btoa == undefined || globalThis.atob == undefined) {
//   global.btoa = (str) => {
//     return Buffer.from(str, "utf8").toString("base64");
//   };
//   global.atob = (b64Encoded) => {
//     return Buffer.from(b64Encoded, "base64").toString("utf8");
//   };
// }

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5

/*
MIT LICENSE
Copyright 2011 Jon Leighton
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function base64ArrayBuffer(arrayBuffer) {
  var base64 = "";
  var encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
}

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function () {
  "use strict";

  var chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  global.encode = function (arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
      i,
      len = bytes.length,
      base64 = "";

    for (i = 0; i < len; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  global.decode = function (base64) {
    var bufferLength = base64.length * 0.75,
      len = base64.length,
      i,
      p = 0,
      encoded1,
      encoded2,
      encoded3,
      encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
      bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

const btoa = (uintarr) => global.encode(uintarr);
const atob = (b64) => new Uint8Array(global.decode(b64));

// var data = {
//   digiEggs: [
//     { id: "ST1-01", count: 4 },
//     { id: "ST1-01", parallel: 1, count: 4 },
//     { id: "ST2-01", count: 1 },
//   ],
//   deck: [
//     { id: "ST1-02", parallel: 1, count: 4 },
//     { id: "ST1-03", count: 4 },
//     { id: "ST1-04", count: 4 },
//     { id: "ST1-05", count: 4 },
//     { id: "ST1-06", count: 4 },
//     { id: "ST1-07", count: 2 },
//     { id: "ST1-08", count: 4 },
//     { id: "ST1-09", count: 4 },
//     { id: "ST1-10", count: 2 },
//     { id: "ST1-11", count: 2 },
//     { id: "ST1-12", count: 4 },
//     { id: "ST1-13", count: 4 },
//     { id: "ST1-14", count: 4 },
//     { id: "P-001", count: 1 },
//     { id: "P-999", count: 1 },
//     { id: "ST1-16", count: 2 },
//   ],
//   name: "Deck name",
// };

/**
 *
 * @param {string} data
 * @returns string base64 encoded string
 */
function dcg_encode(data) {
  var encodedString = "DCG";

  var eggs;
  const setPadding = new Map();
  // group eggs into sets
  if (data.digiEggs === undefined && data.digiEggs.length === undefined) {
    console.log("Bad data");
    return null;
  }

  var parseDataToMap = (parseData) => {
    var mapData = new Map();
    parseData.forEach((d) => {
      var temp = d.id.split("-");
      var set = temp[0];
      var id = Number(temp[1]);
      var parallel = d.parallel || 0;
      if (mapData.has(set)) {
        mapData.get(set).push([id, d.count, parallel]);
      } else {
        mapData.set(set, [[id, d.count, parallel]]);
        setPadding.set(set, temp[1].length);
      }
    });
    return mapData;
  };

  if (data.digiEggs) {
    eggs = parseDataToMap(data.digiEggs);
  }

  const version = 0;
  const eggCount = eggs.size;
  if (data?.name === undefined || data?.name?.length === undefined) {
    console.log("Bad name");
    return;
  }

  const nameBytes = toUTF8Array(data.name);
  const nameBytesLength = nameBytes.length;

  var bytePos = 0;
  byteBuffer = [];
  const writeByte = (b) => {
    byteBuffer[bytePos] = b & 255;
    console.log(
      bytePos,
      b.toString(2).padStart(8, "0"),
      b.toString(16).padStart(2, "0")
    );
    bytePos++;
  };
  const writeString = (s, length) => {
    for (var i = 0; i < length; i++) {
      writeByte(s.charCodeAt(i));
    }
  };

  var byte = (version << 4) | (eggCount & 15);
  writeByte(byte);
  writeByte(0);
  writeByte(nameBytesLength);

  var writeWithCarry = (value) => {
    var carry = value > 127;
    byte = (carry << 7) | (value & 127);
    writeByte(byte);
    if (carry) {
      writeWithCarry(value >> 7);
    }
  };

  var writeDeckMap = (deckMap) => {
    var setKeys = Array.from(deckMap.keys()).sort();
    for (var k = 0; k < setKeys.length; k++) {
      var info = deckMap.get(setKeys[k]);
      //write set ascii
      writeString(setKeys[k].padEnd(4, " "), 4);
      var padding = setPadding.get(setKeys[k]);
      byte = ((padding - 1) << 6) | (info.length & 63);
      writeByte(byte);

      info.sort((a, b) => {
        //compare id
        if (a[0] - b[0] == 0) {
          // compare id
          return a[2] - b[2];
        } else {
          return a[0] - b[0];
        }
      });
      console.log(info);

      var currentOffset = 0;
      for (var j = 0; j < info.length; j++) {
        var count = info[j][1];
        var parallel = info[j][2];
        var id = info[j][0];
        var offset = id - currentOffset;
        var carry = offset > 3;
        byte =
          ((count - 1) << 6) |
          ((parallel << 3) & 56) |
          (carry << 2) |
          (offset & 3);
        writeByte(byte);
        if (carry) {
          writeWithCarry(offset >> 2);
        }
        currentOffset = id;
      }
    }
  };

  //Write egg header if eggs
  if (eggCount > 0) {
    writeDeckMap(eggs);
  }

  // group cards into sets
  if (data.deck == undefined) {
    console.log("Bad format");
    return null;
  }
  var sets = parseDataToMap(data.deck);

  writeDeckMap(sets);

  //calculate checksum
  var checksum = 0;
  for (var i = 3; i < byteBuffer.length; i++) {
    checksum += byteBuffer[i];
  }
  checksum = checksum & 0xff;
  byteBuffer[1] = checksum;

  if (data?.name?.length > 0) {
    for (var i = 0; i < nameBytesLength; i++) {
      writeByte(nameBytes[i]);
    }
  }

  encodedString += base64ArrayBuffer(byteBuffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  console.log(encodedString);
  return encodedString;
}

// decode from json
//

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

  const data = input.substr(3).replace(/\-/g, "+").replace(/\_/g, "/");
  const bData = atob(data);
  const bufferSize = bData.length;
  console.log(atob(data));

  var bytePos = 0;
  const nextByte = (offset = 1) => {
    bytePos += offset;
  };
  const getByte = () => bData[bytePos];
  const getString = (length) =>
    Utf8ArrayToStr(bData.slice(bytePos, bytePos + length));
  //bData.slice(bytePos, bytePos + length).toString("utf8");

  var byte = getByte();
  const version = (byte & 240) >> 4;
  const eggCount = byte & 15;

  console.log(
    bytePos,
    "version",
    version,
    "eggCount",
    eggCount,
    byte.toString(2).padStart(8, "0"),
    byte.toString(16).padStart(2, "0")
  );

  nextByte();
  byte = getByte();
  const checksum = byte;
  console.log(
    bytePos,
    "checksum",
    checksum,
    byte.toString(2).padStart(8, "0"),
    byte.toString(16).padStart(2, "0")
  );

  nextByte();
  byte = getByte();
  const nameLength = byte;

  console.log(
    bytePos,
    "nameLength",
    nameLength,
    byte.toString(2).padStart(8, "0"),
    byte.toString(16).padStart(2, "0")
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
      byte.toString(2).padStart(8, "0"),
      byte.toString(16).padStart(2, "0")
    );

    const getValueWithCarry = (offsetValue, written) => {
      nextByte();
      byte = getByte();
      const carry = byte & 128;
      const value = byte & 127;
      const newValue = (value << written) | offsetValue;
      if (carry) {
        return getValueWithCarry(newValue, written + 7);
      }
      return newValue;
    };

    var setCardOffset = 0;
    var cards = [];
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
        byte.toString(2).padStart(8, "0"),
        byte.toString(16).padStart(2, "0")
      );
      cards.push([
        `${set}-${setCardOffset.toString().padStart(padding, "0")}`,
        cardcount,
      ]);
    }
    return cards;
  };
  var struct = { digiEggs: [], deck: [] };
  for (var i = 0; i < eggCount; i++) {
    struct.digiEggs.push(...readCard());
  }
  totalCards = 0;
  while (totalCards < 49 && bytePos < bData.length - nameLength - 1) {
    struct.deck.push(...readCard());
    console.log(totalCards, bytePos);
  }

  // for (var i = 0; i < 20; i++) {
  //   console.log(
  //     i,
  //     bData[i].toString(2).padStart(8, "0"),
  //     bData[i].toString(16).padStart(2, "0")
  //   );
  // }
  nextByte();
  console.log(getString(nameLength));
  return struct;
}

/* dcg_decode(
  "DCGAV0dU1QxIEHBU1QxIE7CwcHBwUHBwUFBwcEBiFNUMiBBRwNTVDMgQUQEU3RhcnRlciBEZWNrLCBHYWlhIFJlZCBbU1QtMV0"
); */
//console.log(dcg_decode("DCGAfQAQlQyIIEBQlQyIIEGGw=="));
//dcg_decode("DCGIScdAJydAUEDAZydAUgDAgMBAwEDAQMBAQEDBwMCU3RhcnRlciBEZWNrLCBHYWlhIFJlZCBbU1QtMV0");
// dcg_encode(data);

export var encode = dcg_encode;
export var decode = dcg_decode;
var codec = { encode, decode };
export default codec;
