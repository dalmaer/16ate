#
# Take a Number of hours and return the correct string to handle a couple of issues:
# - "2 hours" vs. "1 hour" (plural)
#
# It turns out that my use cases always need the number to be absolute,
# so default to handling that for me.
#
#   number(-1) == number(1) == "1 hour"
#
# To change that behaviour set forceAbsoluteNumbers to false.
#
#   number(-1) == "-1 hour" and number(1) == "1 hour"
#
# TODO:
#
# - having the global 'forceAbsoluteNumbers' flag is awful
#
#   plural = require('../lib/plural').withAbsoluteNumbers()
#   plural.hours(-2) -> "2 hours"
#

# create a namespace to export our public methods
root = exports ? this

# evil global state I know!
root.forceAbsoluteNumbers = true

root.hours = (hours) => number hours, "hour"

root.minutes = (minutes) => number minutes, "minute"

root.number = number = (number, time) ->
  number = Math.abs(number) if root.forceAbsoluteNumbers # make sure we are positive only
  returnTime = "#{number} #{time}"
  returnTime = "#{returnTime}s" unless number in [1, -1]
  returnTime
