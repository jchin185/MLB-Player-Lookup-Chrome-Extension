// based on http://stackoverflow.com/questions/247483/http-get-request-in-javascript
const HttpRequest = function() {
    this.get = (reqURL, callback) => {
        const aHttpRequest = new XMLHttpRequest();
        aHttpRequest.onreadystatechange = () => {
            if (aHttpRequest.readyState === 4 && aHttpRequest.status === 200) {
                callback(aHttpRequest.responseText);
            }
        }

        aHttpRequest.open('GET', reqURL, true);
        aHttpRequest.send(null);
    }
};

function searchActivePlayers(selectionText, resText) {
  const resJSON = JSON.parse(resText);
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
  const selectionText = info.selectionText.trim();
  const httpRequest = new HttpRequest();

  // Send out the request
  const reqURL = 'http://mlb.mlb.com/lookup/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27' 
    + selectionText + '%25%27&active_sw=%27Y%27';
  httpRequest.get(reqURL, searchActivePlayers.bind(null, selectionText));
};

// Create the context menu
chrome.contextMenus.create({
  title: 'Search MLB Players: %s', 
  contexts: ['selection'], 
  onclick: searchMLB
});