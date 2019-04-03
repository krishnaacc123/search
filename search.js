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

var multiSearch = (searchStr, str) => {
  var search = [], startIndex = 0, index;
  searchStr = searchStr.toLowerCase();
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    search.push({ start: index, end: index + searchStr.length - 1 });
    if (search[search.length - 1].end - search[0].start >= MAX_TEXT_LEN) {
      search.pop();// remove last one
      break;
    }
    startIndex = index + searchStr.length;
  }
  // console.log("searching:",searchStr,"=>",search)
  return search;
}

// trims text to max 200 length around the term
function trimString(s, term) {
  var str = s.toLowerCase();
  term = term.toLowerCase();
  var startIndex = str.indexOf(term);
  // console.log("startIndex:",startIndex);
  var endIndex = startIndex + term.length - 1;
  var trimmedText = "";
  if (s.length <= MAX_TEXT_LEN) {
    trimmedText = s;
  }
  else {
    trimmedText = s.substring(startIndex - MAX_TEXT_LEN / 2, endIndex + MAX_TEXT_LEN / 2);
  }
  return trimmedText;
}

function highlight(str, indexes) {
  const HL_START = '<span class="highlight">';
  const HL_END = '</span>';
  var padding = 0;
  indexes.sort(function(a, b) {
    if(a.start < b.start) return -1;
    if(a.start > b.start) return 1;
    return 0;
  });
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
var search = (findThis) => {
  if(!findThis) {
    return [];  // if empty return
  }
  var results = [], search_result = [];
  console.log("----------search------------",findThis);
  try {
    search_result = idx.search(findThis);
  } catch(e) {
    return [];  // if error occurs in lunr search return
  }

  var searchKeywords = findThis.split(' ');
  searchKeywords = searchKeywords.map(function(key) {
    return key.toLowerCase();
  })
  searchKeywords = searchKeywords.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  })
  console.log("searh",searchKeywords);
  // console.log("search_result:",search_result);
  search_result = search_result.slice(0, 50); // only look in first fifty results
  search_result.forEach((o) => {
    if(o.score > 0) {               // filter out 0 score results 
      let file = allContent[o.ref]; // o.ref is id to differentiate all json data
      let { title, desc, body, layout, url } = file;
      let indexesTitle = [], indexesDesc = [], indexesBody = [],
          text = '', bodyTerm, indexesBodyTemp = [], foundFirstTermForBody = false, lowerText = '';
      title = title ? title.toLowerCase() : ''; // converting once and all to lowercase for ease in searching
      desc = desc ? desc.toLowerCase() : '';
      body = body ? body.toLowerCase() : '';
      console.log(file.title, ":", o.score, o.matchData.metadata);
      searchKeywords.forEach(function(term) {
        // console.log("term:",term);
        indexesTitle = indexesTitle.concat(multiSearch(term, title)); // key to search, content to search on
        console.log("term:",term,indexesTitle);
        indexesDesc = indexesDesc.concat(multiSearch(term, desc));
        indexesBodyTemp = multiSearch(term, body);// TODO replace by indexof keeping in mind casing
        if (!foundFirstTermForBody && indexesBodyTemp.length) {
          bodyTerm = term;
          foundFirstTermForBody = true;
        }
      });
      title = file.title; // if not foung in title reset to original as it's lowercase
      if (indexesTitle.length) {
        title = highlight(file.title, indexesTitle);
      }
      if (indexesDesc.length) {
        text = highlight(file.desc, indexesDesc);
      } else if (bodyTerm) {
        text = trimString(file.body, bodyTerm);
        console.log("trimtext:",text);
        lowerText = text.toLowerCase();
        searchKeywords.forEach(function (trm) {
          indexesBody = indexesBody.concat(multiSearch(trm, lowerText));
        });
        text = highlight(text, indexesBody);
        text = '...' + text + '...';
      }
      if (layout) {
        layout = layout.charAt(0).toUpperCase() + layout.slice(1);
      }
      console.log("indeces:",indexesTitle,indexesDesc,indexesBody)
      let q = {
        title: title,
        url,
        hl: text || file.desc || "",
        tag: layout || "Docs"
      };
      results.push(q);
    }
  });
  return results;
}

module.exports = search;