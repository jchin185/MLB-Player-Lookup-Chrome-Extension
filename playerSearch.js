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
function getMLBID(selectionText, resJSON) {
  let playerID = '',
    oneName = false;
  if (selectionText.split(' ').length === 1) {
    oneName = true;
  }

  // If there is only one result, results will be one object, not be an array
  // else search the row array for a match
  if (resJSON.search_player_all.queryResults.totalSize == 1) {
    playerID = resJSON.search_player_all.queryResults.row.player_id;
  } else if (resJSON.search_player_all.queryResults.totalSize > 1) {
    for (const player of resJSON.search_player_all.queryResults.row) {
      if ((oneName && player.name_first === selectionText) || (oneName && player.name_last === selectionText)|| (player.name_display_first_last === selectionText)) {
        playerID = player.player_id;
        break;
      }
    }
  }

  return playerID;
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

function searchMLB(info, tab) {
  const selectionText = info.selectionText.trim();
  let reqURL = 'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27'
      + selectionText + '%25%27&active_sw=%27Y%27';
  let urlArr = [
                {
                  reqURL:'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27QUERY%25%27&active_sw=%27Y%27',
                  tabURL: 'http://m.mlb.com/player/PLAYER_ID',
                  function: getMLBID
                },
                {
                  reqURL: 'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27QUERY%25%27&active_sw=%27N%27',
                  tabURL: 'http://m.mlb.com/player/PLAYER_ID',
                  function: getMLBID
                }
               ];

  spawn(function *() {
    let playerFound = false;
    for (const urlObj of urlArr) {
      const resJSON = yield getJSON(urlObj.reqURL.replace('QUERY', selectionText));
      const retID = urlObj.function(selectionText, resJSON);
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
  onclick: searchMLB
});