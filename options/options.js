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
		selectionBox.innerHTML += `<option>${team.FullName} (${team.Abbreviation})</option>`; 
	}
};

window.onload = () => {
	addTeamNames();
};
