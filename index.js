// The magical global state
var state;

// Wire up the events and get ready
$(document).ready(function() {
	// Setup the initial state by trying to read some from local storage
	state = readState();

	// If this is the first time ever seed a default state
	if ( (state === null) || (!"goal" in state) ) {
		state = {
			period: "eating", // let's assume you are eating
			goal: 16,         // hours to stay in fasting mode (this is 16ate after all!)
			time: nearestHour().subtract(8, "hours") // set to be 8 hours ago
		}
		saveState();
	}

	render();

	// Handle the main button which marks the flip between states
	$("#eat").click(function(e) {
		if (inFast()) {
			state.period = "eating";  // switch to eating
		} else {
			state.period = "fasting";	// switch to fasting
		}
		state.time = nearestHour();

		saveState();

		render();
	});

	// Handle the settings / debug button
	$("#settings").click(function(e) {
		state.time = moment($("#settings-time").val());
		state.goal = parseInt($("#settings-goal").val())

		console.log("Manually settings the state to: ");
		console.log("Time: ", state.time);
		console.log("Goal: ", state.goal);

		saveState();

		render();
	});

});

// The ideal consuming hours are the inverse of your fasting goal time
// If you stick to that amount, chances are it will be easier to stick to a rhythm
function idealNumberOfEatingHoursPerDay() {
	return 24 - state.goal;
}

// Given a time, find the nearest half an hour and return that time
// If the hour has more than 30 minutes, add 30 and then it is save to get
function nearestHour(time) {
	// If no time has been passed in, use the current moment
	if (typeof time !== "object") time = moment();

	if (time.minute() > 30) {
		time.add(31, 'minutes');
	}
	return time.clone().startOf("hour");
}

function inFast() {
	return state.period === "fasting";
}

function render() {
	console.log(Date.now());
	if (inFast()) {
		renderFastingState();
	} else {
		renderEatingState();
	}
}

function renderEatingState() {
	var idealFastTime = state.time.clone().add(idealNumberOfEatingHoursPerDay(), "hours");
	var idealHours = idealFastTime.from(moment().startOf("hour"), true);

	$("#hourmarker").html(idealHours);

	$("#mode").html("You are eating");

	// "$IDEALHOURS hours until your ideal start time @$IDEALFROMNOW"
	$("#timeleft").html("until you should start fasting at <strong>" + idealFastTime.format('ha') + "</strong>");
	
	$("#laststatus").html("You first meal was at <strong>" + state.time.format('ha') + "</strong>");

	$("#eat").html("Start Fasting");
}

function renderFastingState() {
	// The time that is $GOAL hours from when fasting began
	var goalEndOfFastTime = state.time.clone().add(state.goal, "hours");

	// The hours from $NOW to the $GOAL time
	var hoursUntilGoalEndOfFastTime = goalEndOfFastTime.from(nearestHour(), true);

	$("#hourmarker").html(hoursUntilGoalEndOfFastTime);

	$("#mode").html("You are fasting");

	var hoursUntilNumber = parseInt(hoursUntilGoalEndOfFastTime);
	if (!isNaN(hoursUntilNumber)) {
		// Green: you have reached your goal, any additional hours are now gravy!
		if (hoursUntilNumber < 1) {
			$("#hourmarker").addClass("green");
		// Yellow: you are within 8 hours of your goal
		} else if (hoursUntilNumber < idealNumberOfEatingHoursPerDay()) {
			$("#hourmarker").addClass("yellow");
		// Red: you are more than 8 hours out from the goal
		} else {
			$("#hourmarker").addClass("red");
		}
	}

	// "to hit your $GOAL goal @ $GOALTIME"
	$("#timeleft").html("to hit your <em>" + state.goal + " hours</em> goal at <strong>" + goalEndOfFastTime.format('ha') + "</strong>");

	$("#laststatus").html("You last meal was at <strong>" + state.time.format('ha') + "</strong>");

	$("#eat").html("Start Eating");
}

setInterval(render, 1000 * 60);

// -- storage
function saveState() {
	if (localStorageWorks) {
		localStorage.setItem("state", JSON.stringify(state));
	} else {
		window['globalState'] = state;
	}
}

function readState() {
	// NUKE
	// localStorage.removeItem("state");
	// return;

	if (localStorageWorks) {
		var read = JSON.parse(localStorage.getItem("state"));
		if (read != null && "time" in read) {
			read.time = moment(read.time); // convert the time back to a moment object
		}
		return read;
	} else {
		return window['globalState'];
	}
}

// only need to check once
var localStorageWorks = !!function() {
	var test = 't';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch(e) {
    return false;
  }
}();


// It is 10am and I am in the fasting state, with my "last meal" time at 7pm yesterday
// The time should say 1 hour to goal
// I hit the button to shift to the eating state
// - Calculate the number of hours between now (10am) and yesterday at 7pm
// - set state.meal == "first"
// - set state.time == now (now == rounded to the nearest hour)
// - change #hourmarker to be (24-$GOAL) hours ("8 hours")
// - change #timeleft to be "until you will start your fast @$IDEALFROMNOW" where $IDEALFROMNOW is $NOW + 8 hours
// - change #laststatus to be "Your first meal was at $NOW"

// If is 7pm and I am in the eating state, with my "fist meal" time at noon
// The time should say "7 hours" (time since I started to eat)
// I hit the button to shift to the fasting state
// - set state.meal == "last"
// - set state.time == now
// - change #hourmarker to be $GOAL hours ("16 hours")
// - change #timeleft to be "to hit your $GOAL goal @ $GOALTIME" where goaltime is $NOW + $GOAL
// - change #laststatus to be "Your last meal was at $NOW" (rounded)
