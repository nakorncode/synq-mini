# Persist the chosen layout per music service in extension storage

The layout is a durable user preference, not a property of one window. Choosing
`compact` and reopening the PiP window must not silently return the user to
`standard`.

The choice is therefore stored in extension storage, keyed by music service, and read
by both the popup and the PiP surface. It is not kept in PiP window memory and not
scoped per tab: the user has one intended way to view their player, not one per tab.

## Consequences

Layout selection outlives the PiP window, so it also applies to the in-page mini
player. Switching layout is consequently a two-part action: update the persisted
preference, and resize the current PiP window, which needs a user gesture and can
only succeed inside the click handler that made the change.
