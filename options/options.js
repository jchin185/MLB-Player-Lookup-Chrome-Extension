const teamArr = [{"FullName": "Arizona Diamondbacks", "Abbreviation": "AZI"}, 
				 {"FullName": "Atlanta Braves", "Abbreviation": "ATL"},
				 {"FullName": "Baltimore Orioles", "Abbreviation": "BAL"},
				 {"FullName": "Boston Red Sox", "Abbreviation": "BOS"},
				 {"FullName": "Chicago Cubs", "Abbreviation": "CHC"},
				 {"FullName": "Chicago White Sox", "Abbreviation": "CWS"},
				 {"FullName": "Cleveland Indians", "Abbreviation": "CLE"},
				 {"FullName": "Cincinnati Reds", "Abbreviation": "CIN"},
				 {"FullName": "Colorado Rockies", "Abbreviation": "COL"},
				 {"FullName": "Detroit Tigers", "Abbreviation": "DET"},
				 {"FullName": "Houston Astros", "Abbreviation": "HOU"},
				 {"FullName": "Los Angeles Angels", "Abbreviation": "LAA"},
				 {"FullName": "Los Angeles Dodgers", "Abbreviation": "LAD"},
				 {"FullName": "Kansas City Royals", "Abbreviation": "KCR"},
				 {"FullName": "Milwaukee Brewers", "Abbreviation": "MIL"},
				 {"FullName": "Minnesota Twins", "Abbreviation": "MIN"},
				 {"FullName": "Miami Marlins", "Abbreviation": "MIA"},
				 {"FullName": "New York Mets", "Abbreviation": "NYM"},
				 {"FullName": "New York Yankees", "Abbreviation": "NYY"},
				 {"FullName": "Philadelphia Phillies", "Abbreviation": "PHI"},
				 {"FullName": "Oakland Athletics", "Abbreviation": "OAK"},
				 {"FullName": "Pittsburgh Pirates", "Abbreviation": "PIT"},
				 {"FullName": "San Diego Padres", "Abbreviation": "SDP"},
				 {"FullName": "San Franciso Giants", "Abbreviation": "SFG"},
				 {"FullName": "Seattle Mariners", "Abbreviation": "SEA"},
				 {"FullName": "St. Louis Cardinals", "Abbreviation": "STL"},
				 {"FullName": "Tampa Bay Rays", "Abbreviation": "TBR"},
				 {"FullName": "Texas Rangers", "Abbreviation": "TEX"},
				 {"FullName": "Toronto Blue Jays", "Abbreviation": "TOR"},
				 {"FullName": "Washington Nationals", "Abbreviation": "WSH"}];

function addTeamNames() {
	const selectionBox = document.getElementById('TeamOption');

	for (const team of teamArr) {
		const option = document.createElement('option');
		const text = document.createTextNode(`${team.FullName} (${team.Abbreviation})`);
		option.appendChild(text);
		option.setAttribute('value', JSON.stringify(team));
		selectionBox.appendChild(option);
	}
	chrome.storage.sync.get({
		team: teamArr[0]
	}, (items) => {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError);
		} else {
			selectionBox.selectedIndex = teamArr.findIndex((elem) => {
				return (elem.FullName === items.team.FullName) && (elem.Abbreviation === items.team.Abbreviation);
			});
		}
	});
};

function saveOptions() {
	const selectedTeam = JSON.parse(document.getElementById('TeamOption').value);

	chrome.storage.sync.set({
		team: selectedTeam
	}, () => {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError);
		} else {
			const overlay = document.getElementById('overlay'),
				status = document.getElementById('saveStatus');

			status.textContent = 'Saved!';
			overlay.style.display = 'block';
			status.style.display = 'block';
			setTimeout(() => {
				overlay.style.display = 'none';
				status.style.display = 'none';
			}, 1000);
		}
	});
};

window.onload = () => {
	addTeamNames();
	document.getElementById('save').addEventListener('click', saveOptions);
};
