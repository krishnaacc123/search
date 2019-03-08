const lunr = require('lunr');
const data = require("./contents");

// initialise lunr.js
var idx = lunr(function () {
  this.ref('title');
  this.field('title', { boost: 10 });
  this.field('body');
  this.field('desc');
  data.forEach(function (doc) {
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
      let diff = search[1].index - search[0].index;
      if (diff > 30) {
        search.pop();
      }
      stp = true;
    }
  }
  return search;
}

// returns back the string 
// to showcase in the results (right-side)
var _find = (str, v, type) => {
  let s = str.toLowerCase(),
    new_str = '';
  if (type === 'title') {
    new_str = str;
  } else {

    var i_search = multiSearch(v, s);
    let index = find_index(str, i_search, v.length);
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
    new_index = multiSearch(v, st);
  var index = [];
  if (new_index.length === 2) {
    new_index.map(function (o) {
      let i = {
        start: o.index,
        end: o.index + v.length
      };
      index.push(i);
    })
  } else {
    let i = {
      start: new_index[0].index,
      end: new_index[0].index + v.length
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
  if (v) {
    var results = [];
    var search_result = idx.search(v);
    var r = search_result.map((o) => {
      var i = data.map((file) => {
        if (o.ref === file.title) {
          var hl = {},
            title = file.title.toLowerCase(),
            desc = file.desc ? file.desc.toLowerCase() : '',
            body = file.body.toLowerCase(),
            val = v.toLowerCase();
          if (title && title.indexOf(val) > -1) {
            hl = _find(file.title, val, 'title');
          } else if (desc && desc.indexOf(val) > -1) {
            hl = _find(file.desc, val, 'desc');
          } else if (body) {
            if (file.body.indexOf(val) > -1) {
              hl = _find(file.body, val, 'body');
            }
          }
          let q = {
            title: file.title,
            url: `/docs/${file.url}`,
            desc: file.desc,
            hl: hl
          };
          results.push(q);
        }
      })
    });
    return results;
  } else {
    return [];
  }
}

module.exports = search;