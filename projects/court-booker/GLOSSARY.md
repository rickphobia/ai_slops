# court-booker

Books the badminton court at 1120 Park Avenue on Picktime for one person, so nobody has to be awake when a date opens for booking.

## People

**Operator**:
The one person who uses court-booker to set up and watch Booking Requests.
_Avoid_: user, admin

**Profile**:
The details Picktime needs to make a Booking: first name, email, unit number and mobile. There is one Profile, and it may belong to someone other than the Operator.
_Avoid_: account, user data, customer

## Booking

**Court**:
The single badminton court (Picktime calls it "Badminton Hall 1") that court-booker books.
_Avoid_: hall, resource

**Slot**:
A two-hour period on the Court on a given date, named by its start time (08:00, 10:00 … 20:00).
_Avoid_: session, time

**Booking Request**:
A date plus the Slots the Operator wants on that date, waiting to be booked once that date opens. Every Slot in it is booked separately, so one Booking Request can end with some Slots booked and others taken.
_Avoid_: prebuilt, pre-booking, reservation

**Booking Window**:
How many days ahead Picktime accepts bookings for the Court (two days at the time of writing).
_Avoid_: advance period

**Release Time**:
The moment a date enters the Booking Window: midnight, Malaysia time, Booking Window days before that date.
_Avoid_: opening time, 12am

**Booking**:
A reservation that Picktime has confirmed for the Profile.
_Avoid_: reservation, appointment

**Dry run**:
A booking attempt that fills in the real Picktime form for a Slot and stops before clicking Book, to check court-booker still works with the live page. It never makes a Booking.
_Avoid_: test booking, rehearsal

**Run time**:
The moment a Booking Request is booked: a random moment just after its date's Release Time (or about a minute after creation, for a date already open). Chosen once, when the request is made.
_Avoid_: trigger time

**Booking Request status**:
Waiting (not run yet; can be edited or cancelled), Booking… (running now), Done (every Slot has a result) or Cancelled.

**Slot status**:
Waiting, Booking… (being tried now), Booked (Picktime confirmed it), Taken (someone else has it; never retried) or Failed (with a reason in words, such as Picktime's own text, "date not open on Picktime yet", "missed" when the server was down past the date, or "interrupted, check Picktime" when a restart cut the run short).
_Avoid_: success, error
