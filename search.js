const lunr = require('lunr');
const allContent = require("./contents");

// initialise lunr.js
var idx = lunr(function () {
  this.ref('id');
  this.field('title', { boost: 10 });
  this.field('body');
  this.field('desc');
  allContent.forEach(function (doc) {
    this.add(doc)
  }, this)
});

// returns back the index of the string
// to be showcased in the results (right-side)
// var find_index = (str, index, l) => {
//   var len = str.length,
//     start = 0,
//     end = 0;

//   if (len <= 30) {
//     start = 0;
//     end = len;
//   } else if (index.length === 2) {

//     let index1 = index[0].index,
//       index2 = index[1].index;

//     start = index1 - 5 <= 0 ? 0 : index1 - 5;
//     end = index1 + (index2 - index1) + l + 5 >= len
//       ? len
//       : start > 15
//         ? index1 + (index2 - index1) + l + 5
//         : index1 + (index2 - index1) + l + 10;
//   }
//   else {
//     let indexx = index[0].index;
//     start = indexx - 15 <= 0 ? 0 : indexx - 15;
//     end = indexx + 15 >= len
//       ? len
//       : start > 15
//         ? indexx + l + 15
//         : indexx + l + 25;
//   }
//   return {
//     start,
//     end
//   };
// }

var MAX_TEXT_LEN = 200; // find and return max 300 characters of description

var multiSearch = (v, s) => {
  console.log();
  var re = new RegExp(v, "g"),
    match = [],
    search = [];
  while ((match = re.exec(s)) != null) {
    search.push({ start: match.index, end: match.index + v.length - 1 });
    if (search[search.length - 1].end - search[0].start >= MAX_TEXT_LEN) {
      break;
    }
  }
  console.log("searching:",v,"=>",search)
  return search;
}

function partialString(startIndex) {
  var i = 0;
  // extract text block
  if (s.length <= MAX_TEXT_LEN) {
    trimmedText = s;
  }
  else {
    startIndex = search[0].start;
    trimmedText = s.substring(i - MAX_TEXT_LEN / 2, i - 1) + s.substring(i, i + MAX_TEXT_LEN / 2);
  }
}

/* Core search functionality
/* */
var search = (v) => {
  if(!v) {
    return [];  // if empty return
  }
  var results = [], search_result = [];
  console.log("----------search------------",v);
  try {
    search_result = idx.search(v);
  } catch(e) {
    return [];  // if error occurs in lunr search return
  }

  console.log("search_result:",search_result);
  
  search_result.forEach((o) => {
    if(o.score > 0) {               // filter out 0 score results 
      let file = allContent[o.ref]; // o.ref is id to differentiate all json data
      let { title, desc, body, layout, url } = file;
      let indexesTitle = [], indexesDesc = [], indexesBody = [];
      title = title ? title.toLowerCase() : ''; // converting once and all to lowercase for ease in searching
      desc = desc ? desc.toLowerCase() : '';
      body = body ? body.toLowerCase() : '';
      var searchKeywords = Object.keys(o.matchData.metadata); //lunr returns this json result
      console.log(file.title, ":", o.score, o.matchData.metadata);
      //
      // todo add own filtered full key in searchKeywords eg: searched not search
      //
      searchKeywords.forEach(function(term) {
        console.log("term:",term);
        var placesFoundIn = Object.keys(o.matchData.metadata[term]); // => title/desc/body
        placesFoundIn.forEach(function(place) {
          console.log("place:",place);
          if (place == "title") {
            indexesTitle = indexesTitle.concat(multiSearch(term, title)); // key to search, content to search on
          } else if (place == "desc") {
            indexesDesc = indexesDesc.concat(multiSearch(term, desc));
          } else if (place == "body") {
            indexesBody = indexesBody.concat(multiSearch(term, body));
          }
        });
      });
      console.log("indeces:",indexesTitle,indexesDesc,indexesBody)
      let q = {
        title: file.title,
        url,
        desc: file.desc,
        hl: "",
        tag: layout || "Docs"
      };
      results.push(q);
    }
  });
  return results;
}

module.exports = search;



    // if (i < MAX_TEXT_LEN / 2) {
    //   i = i + v.length - 1;
    //   while (s[i] && i < MAX_TEXT_LEN) {
    //     i++;
    //   }
    //   trimmedText = s.substring(0,i);
    // } else {
    //   while (s[i] && s.length - i >= MAX_TEXT_LEN) {
    //     i--;
    //   }
    //   trimmedText = s.substring(i, s.length - 1);
    // }