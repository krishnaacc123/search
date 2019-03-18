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
var find_index = (str, index, l) => {
  var len = str.length,
    start = 0,
    end = 0;

  if (len <= 30) {
    start = 0;
    end = len;
  } else if (index.length === 2) {

    let index1 = index[0].index,
      index2 = index[1].index;

    start = index1 - 5 <= 0 ? 0 : index1 - 5;
    end = index1 + (index2 - index1) + l + 5 >= len
      ? len
      : start > 15
        ? index1 + (index2 - index1) + l + 5
        : index1 + (index2 - index1) + l + 10;
  }
  else {
    let indexx = index[0].index;
    start = indexx - 15 <= 0 ? 0 : indexx - 15;
    end = indexx + 15 >= len
      ? len
      : start > 15
        ? indexx + l + 15
        : indexx + l + 25;
  }
  return {
    start,
    end
  };
}

var multiSearch = (v, s) => {
  var stp = false,
    re = new RegExp(v, "g"),
    match = [],
    search = [];
  while ((match = re.exec(s)) != null && !stp) {
    search.push({ index: match.index });
    if (search.length === 2) {
      if (search[1].index - search[0].index > 30) {
        search.pop();
      }
      stp = true;
    }
  }
  return search;
}

// returns back the string 
// to showcase in the results (right-side)
var _find = (str, valToFind, type) => {
  let s = str.toLowerCase(), 
    new_str = '';
  if (type === 'title') {
    new_str = str;
  } else {
    var i_search = multiSearch(valToFind, s);
    console.log("i_search",i_search);
    let index = find_index(str, i_search, valToFind.length);
    if (index.start == 0 && index.end == str.length) {
      new_str = str.substring(index.start, index.end);
    } else if (index.start == 0) {
      new_str = `${str.substring(index.start, index.end)}..`;
    } else if (index.end == str.length) {
      new_str = `..${str.substring(index.start, index.end)}`;
    } else {
      new_str = `..${str.substring(index.start, index.end)}..`;
    }
  }
  let st = new_str.toLowerCase(),
    new_index = multiSearch(valToFind, st);
  var index = [];
  if (new_index.length === 2) {
    new_index.map(function (o) {
      let i = {
        start: o.index,
        end: o.index + valToFind.length
      };
      index.push(i);
    })
  } else {
    let i = {
      start: new_index[0].index,
      end: new_index[0].index + valToFind.length
    };
    index.push(i);
  }
  return {
    new_str,
    index
  };
}

// core search functionality
var search = (v) => {
  if(!v) {
    return [];
  }
  var results = [], search_result = [];
  console.log("----------search------------",v);
  try {
    search_result = idx.search(v);
  } catch(e) {
    console.log("Error:",e);
  }
  
  var r = search_result.map((o) => {
    if(o.score > 0) {
      var file = allContent[o.ref];// indexing starts from 1
      var hl = {},
        title = file.title.toLowerCase(),
        desc = file.desc ? file.desc.toLowerCase() : '',
        body = file.body.toLowerCase(),
        { layout } = file,
        val = Object.keys(o.matchData.metadata)[0].toLowerCase(); // using metadata instead of search keyword
      console.log(file.title, ":", o.score, o.matchData.metadata);
      if (title && title.indexOf(val) > -1) {
        hl = _find(file.title, val, 'title');
      } else if (desc && desc.indexOf(val) > -1) {
        hl = _find(file.desc, val, 'desc');
      } else if (body && body.indexOf(val) > -1) {
        hl = _find(file.body, val, 'body');
      }
      let q = {
        title: file.title,
        url: file.url,
        desc: file.desc,
        hl: hl,
        tag: layout || "Docs"
      };
      results.push(q);
    }
  });
  return results;
}

module.exports = search;