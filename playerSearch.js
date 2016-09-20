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
    searchPrefix = '',
    firstNameProp = '',
    lastNameProp = '',
    fullNameProp = '',
    oneName = false;
  if (playerName.split(' ').length === 1) {
    oneName = true;
  }
  if (isMajorLeague) {
    searchPrefix = 'search_player_all';
    firstNameProp = 'name_first';
    lastNameProp = 'name_last';
    fullNameProp = 'name_display_first_last';
  } else {
    searchPrefix = 'milb_player_search';
    firstNameProp = 'player_name_first';
    lastNameProp = 'player_name_last';
    fullNameProp = 'name_first_last';
  }
  const numResults = searchObj[searchPrefix].queryResults.totalSize;

  // If there is only one result, results will be one object, not an array
  if (numResults > 0) {
    const rowObj = searchObj[searchPrefix].queryResults.row;
    if (numResults == 1) {
      if ((oneName && rowObj[firstNameProp].toLowerCase() === playerName) || (oneName && rowObj[lastNameProp].toLowerCase() === playerName) || (rowObj[fullNameProp].toLowerCase() === playerName)) {
        playerID = rowObj.player_id;
      }
    } else if (numResults > 1) {
      for (const player of rowObj) {
        if ((oneName && player[firstNameProp].toLowerCase() === playerName) || (oneName && player[lastNameProp].toLowerCase() === playerName) || (player[fullNameProp].toLowerCase() === playerName)) {
          playerID = player.player_id;
          break;
        }
      }
    }
  }

  return playerID;
};

/** Modified binary search on reverse sorted list of players from baseball reference
 *  @param name the name to search for
 *  @param arr the array to search through
 *  @return the index if a match was found, else -1
 */
function BBReferenceNameSearch(name, arr) {
  let lo = 0,
      hi = arr.length - 1;

  while (lo <= hi) {
    let mid = Math.floor(lo + (hi - lo) / 2);
    const compResult = BBReferenceNameCmp(arr[mid], name);
    if (compResult === 0) {
      return mid;
    // The list is reverse sorted by last name
    // But there is no sorting on players with same last name
    // Therefore, once a result with last name is found,
    // Look left and right to find players with same last name to compare to
    } else if (compResult === 1) {
      // We can ignore the current player because that would have returned a value of 0
      // First look to the left
      let currInd = mid;
      do {
        currInd--;
        if (BBReferenceNameCmp(arr[currInd], name) === 0) {
          return currInd;
        }
      } while(BBReferenceNameCmp(arr[currInd], name) === 1);
      // Now look right
      currInd = mid;
      do {
        currInd++;
        if (BBReferenceNameCmp(arr[currInd], name) === 0) {
          return currInd;
        }
      } while(BBReferenceNameCmp(arr[currInd], name) === 1);
      // No results
      break;
    } else if (compResult === 2) {
      lo = mid + 1;
    } else {
      hi = mid -1;
    }
  }

  return -1;
};

/** Comparison function for searching the player list JSON by name for baseball reference
 *  @param playerObj the object representing a player
 *  @param name the name to be searched for
 *  @return 0 if the player full name and name are equal,
 *          1 if the player last name and name are equal
 *          -1 if the player last name is alphabetically before name
 *          else 2
 */
function BBReferenceNameCmp(playerObj, name) {
  const playerName = playerObj.v.toLowerCase(),
        playerLastName = playerName.split(' ')[1];
        searchLastName = name.split(' ')[1];
  if (playerName === name) {
    return 0;
  } else if (playerLastName === searchLastName) {
    return 1;
  } else if (playerLastName < searchLastName) {
    return -1;
  } else {
    return 2;
  }
};

// Returns the Baseball Reference id if a player is found, otherwise emtpy string
function getBBReferenceID(playerName, searchObj){
  const ind = BBReferenceNameSearch(playerName, searchObj);
  return (ind !== -1) ? searchObj[ind].i : '';
};

// Returns the suffix for the Baseball Reference player URL
function getBBReferenceSuffix(playerID) {
  //first letter of last name followed by id
  return (playerID) ? `${playerID[0]}/${playerID}` : '';
};

// Wrapper function
function getBBReferenceFullID(playerName, searchObj) {
  return getBBReferenceSuffix(getBBReferenceID(playerName, searchObj));
};

// Remove whitespace and replace accented characters
function sanitizeText(inputText) {
  let cleanText = inputText.trim().toLowerCase();
  // Replace accented letters with their unaccented counterparts
  cleanText = cleanText.replace('\u{000E1}', 'a'); // accented a
  cleanText = cleanText.replace('\u{000E9}', 'e'); // accented e
  cleanText = cleanText.replace('\u{000F1}', 'n'); // n with ~
  cleanText = cleanText.replace('\u{000F3}', 'o'); // accented o

  return cleanText;
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

  const selectionText = sanitizeText(info.selectionText);
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
        retID = getBBReferenceFullID(selectionText, resJSON);
      }

      if (retID) {
        createTab(urlObj.tabURL.replace('PLAYER_ID', retID));
        playerFound = true;
        break;
      }
    }
    if (!playerFound) {
      createTab('https://www.google.com/search?q=' + info.selectionText);
    }
  });
};

chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu
  chrome.contextMenus.create({
    title: 'Search MLB Players: %s',
    contexts: ['selection'],
    id: 'BaseballSearch'
  });
});

chrome.contextMenus.onClicked.addListener(searchMLB);
