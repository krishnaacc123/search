const lunr = require('lunr');
const allContent = require("./contents");
const MAX_TEXT_LEN = 200; // find and return max 200 characters max from body

// initialise lunr.js
var idx = lunr(function () {
  this.ref('id');
  this.field('title', { boost: 10 });
  this.field('body');
  this.field('desc');
  allContent.forEach(function (doc) {
    var { index } = doc; 
    if (index == undefined) { // do not use for searching if index == false
      this.add(doc)
    }
  }, this)
});

var multiSearch = (v, s) => {
  console.log();
  var re = new RegExp(v, "g"),
    match = [],
    search = [];
  while ((match = re.exec(s)) != null) {
    search.push({ start: match.index, end: match.index + v.length - 1 });
    if (search[search.length - 1].end - search[0].start >= MAX_TEXT_LEN) {
      search.pop();// remove last one
      break;
    }
  }
  console.log("searching:",v,"=>",search)
  return search;
}

function trimString(s, term) {
  var reg = new RegExp(term, "i");
  var startIndex = reg.exec(s).index;
  console.log("startIndex:",startIndex);
  var endIndex = startIndex + term.length - 1;
  var trimmedText = "";
  if (s.length <= MAX_TEXT_LEN) {
    trimmedText = s;
  }
  else {
    trimmedText = '...' + s.substring(startIndex - MAX_TEXT_LEN / 2, endIndex + MAX_TEXT_LEN / 2) + '...';
  }
  return trimmedText;
}

function highlight(str, indexes) {
  const HL_START = '<span class="highlight">';
  const HL_END = '</span>';
  var padding = 0;
  for(var i = 0; i < indexes.length; i++) {
    padding = i * (HL_START.length + HL_END.length)
    indexes[i].start = indexes[i].start + padding;
    indexes[i].end = indexes[i].end + padding;
  }
  indexes.forEach(function(index) {
    str = str.substring(0, index.start) 
          + HL_START + str.substring(index.start, index.end + 1) + HL_END 
          + str.substring(index.end + 1, str.length + 1);     
  });
  return str;
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
      let indexesTitle = [], indexesDesc = [], indexesBody = [], text = "", bodyTerms =[];
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
            // title = addHighlight(term, file);
            indexesTitle = indexesTitle.concat(multiSearch(term, title)); // key to search, content to search on
          } else if (place == "desc") {
            indexesDesc = indexesDesc.concat(multiSearch(term, desc));
            // desc = addHighlight(term, desc);
          } else if (!indexesDesc.length && place == "body") { // if not found in desc then go for body
            // indexesBody = indexesBody.concat(multiSearch(term, body));
            bodyTerms.push(term);
          }
        });
      });
      title = file.title;
      if (indexesTitle.length) {
        title = highlight(file.title, indexesTitle);
      }
      if (indexesDesc.length) {
        text = highlight(file.desc, indexesDesc);
      } else if (bodyTerms.length) {
        console.log("bodyyy:",bodyTerms)
        text = trimString(file.body, bodyTerms[0]);
        console.log("trimstring:",text);
        bodyTerms.forEach(function(term) {
          indexesBody = indexesBody.concat(multiSearch(term, text.toLowerCase()));
        });
        text = highlight(text, indexesBody);
      }
      console.log("indeces:",indexesTitle,indexesDesc,indexesBody)
      let q = {
        title: title,
        url,
        hl: text || file.desc,
        tag: layout || "Docs"
      };
      results.push(q);
    }
  });
  return results;
}

module.exports = search;