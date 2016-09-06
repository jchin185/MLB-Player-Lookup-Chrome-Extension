// based on http://stackoverflow.com/questions/247483/http-get-request-in-javascript
// and http://www.html5rocks.com/en/tutorials/es6/promises/
const HttpRequest = function() {
  this.get = (reqURL) => {
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
  }
};

function getJSON(req, reqURL) {
  return req.get(reqURL).then(JSON.parse);
};

function searchActivePlayers(selectionText, resJSON) {
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

  // If no player was found, do a google search instead
  (playerID) ? newURL = 'http://m.mlb.com/player/' + playerID : newURL = 'https://www.google.com/search?q=' + selectionText;
  chrome.tabs.create({
    url: newURL
  });
};

function searchMLB(info, tab) {
  const selectionText = info.selectionText.trim(),
    httpRequest = new HttpRequest(),
    reqURL = 'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27'
      + selectionText + '%25%27&active_sw=%27Y%27';

  // Send out the request
  getJSON(httpRequest, reqURL).then((response) => {
    searchActivePlayers(selectionText, response);
  }, (error) => {
    console.log('Failed', error);
  });
};

// Create the context menu
chrome.contextMenus.create({
  title: 'Search MLB Players: %s', 
  contexts: ['selection'], 
  onclick: searchMLB
});