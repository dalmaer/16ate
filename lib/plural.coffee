# Take a Number of hours and return the correct string to handle a couple of issues:
# - "2 hours" vs. "1 hour" (plural)
# - When getting negative hours (getting past the goal for example) convert to positive as the UI will reflect the difference
#   e.g. -1 => 1 hour past your goal!

# create a namespace to export our public methods
root = exports ? this

root.hours = (hours) -> @number hours, "hour"

root.minutes = (minutes) -> @number minutes, "minute"

root.number = (number, time) ->
  number = Math.abs(number) # make sure we are positive only
  returnTime = number + " " + time
  returnTime = returnTime + "s"  unless number is 1
  returnTime
