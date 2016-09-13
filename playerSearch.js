// based on http://stackoverflow.com/questions/247483/http-get-request-in-javascript
// and http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
function HTTPGetRequest(reqURL) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onload = () => {
      if (request.readyState === 4 && request.status === 200) {
        resolve(request.response);
      } else {
        reject(Error(request));
      }
    }

    request.open('GET', reqURL);
    request.send();
  });
};

function getJSON(reqURL) {
  return HTTPGetRequest(reqURL).then(JSON.parse);
};

// Returns a player MLB id if a player is found, otherwise empty string
function getMLBID(playerName, isMajorLeague, searchObj) {
  let playerID = '',
    searchPrefix = '';
    oneName = false;
  if (playerName.split(' ').length === 1) {
    oneName = true;
  }
  (isMajorLeague) ? searchPrefix = 'search_player_all' : searchPrefix = 'milb_player_search';
  const numResults = searchObj[searchPrefix].queryResults.totalSize;

  // If there is only one result, results will be one object, not an array
  if (numResults > 0) {
    const rowObj = searchObj[searchPrefix].queryResults.row;
    if (numResults == 1) {
      playerID = rowObj.player_id;
    } else if (numResults > 1) {
      for (const player of rowObj) {
        if ((oneName && player.name_first.toLowerCase() === playerName) || (oneName && player.name_last.toLowerCase() === playerName)|| (player.name_display_first_last.toLowerCase() === playerName)) {
          playerID = player.player_id;
          break;
        }
      }
    }
  }

  return playerID;
};

// Returns the Baseball Reference id if a player is found, otherwise emtpy string
// *TODO: Do some type of optimized search to avoid going down list one by one*
function getBBReferenceID(playerName, searchObj){
  let playerID = '';
  for (const player of searchObj) {
    if (player.v.toLowerCase() === playerName) {
      playerID = player.i;
      break;
    }
  }

  return playerID;
};

// Returns the suffix for the Baseball Reference player URL
function getBBReferenceSuffix(playerID) {
  //first letter of last name followed by id
  if (playerID) {
    return playerID.split('')[0] + '/' + playerID;
  }
};

function createTab(url) {
  chrome.tabs.create({
    url: url
  });
}

// Taken from http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing
function spawn(generatorFunc) {
  function continuer(verb, arg) {
    var result;
    try {
      result = generator[verb](arg);
    } catch (err) {
      return Promise.reject(err);
    }
    if (result.done) {
      return result.value;
    } else {
      return Promise.resolve(result.value).then(onFulfilled, onRejected);
    }
  }
  var generator = generatorFunc();
  var onFulfilled = continuer.bind(continuer, 'next');
  var onRejected = continuer.bind(continuer, 'throw');
  return onFulfilled();
}

function searchMLB(info) {
  // Make sure its our context menu that was clicked
  if (info.menuItemId !== 'BaseballSearch') {
    return;
  }

  let selectionText = info.selectionText.trim().toLowerCase();
  // Replace accented letters with their unaccented counterparts
  selectionText = selectionText.replace('\u{000E1}', 'a'); // accented a
  selectionText = selectionText.replace('\u{000E9}', 'e'); // accented e
  selectionText = selectionText.replace('\u{000F1}', 'n'); // n with ~
  selectionText = selectionText.replace('\u{000F3}', 'o'); // accented o

  let urlArr = [
                {
                  reqURL:'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27QUERY%25%27&active_sw=%27Y%27',
                  tabURL: 'http://m.mlb.com/player/PLAYER_ID'
                },
                {
                  reqURL: 'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27QUERY%25%27&active_sw=%27N%27',
                  tabURL: 'http://m.mlb.com/player/PLAYER_ID'
                },
                {
                  reqURL: 'http://www.milb.com/lookup/json/named.milb_player_search.bam?active_sw=%27Y%27&name_part=%27QUERY%25%27',
                  tabURL: 'http://www.milb.com/player/index.jsp?sid=milb&player_id=PLAYER_ID'
                },
                {
                  reqURL: 'http://www.baseball-reference.com/inc/players_search_list.json',
                  tabURL: 'http://www.baseball-reference.com/players/PLAYER_ID.shtml'
                }
               ];

  spawn(function *() {
    let playerFound = false;
    for (const urlObj of urlArr) {
      const resJSON = yield getJSON(urlObj.reqURL.replace('QUERY', selectionText));
      let retID = '';
      if (/mlb\.mlb\.com\/lookup/.test(urlObj.reqURL)) {
        retID = getMLBID(selectionText, true, resJSON);
      } else if (/milb\.com\/lookup/.test(urlObj.reqURL)) {
        retID = getMLBID(selectionText, false, resJSON);
      } else if (/baseball-reference/.test(urlObj.reqURL)) {
        retID = getBBReferenceID(selectionText, resJSON);
        retID = getBBReferenceSuffix(retID);
      }

      if (retID) {
        createTab(urlObj.tabURL.replace('PLAYER_ID', retID));
        playerFound = true;
        break;
      }
    }
    if (!playerFound) {
      createTab('https://www.google.com/search?q=' + selectionText);
    }
  });
};

// Create the context menu
chrome.contextMenus.create({
  title: 'Search MLB Players: %s', 
  contexts: ['selection'],
  id: 'BaseballSearch'
});
chrome.contextMenus.onClicked.addListener(searchMLB);
