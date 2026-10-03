# 035 — Chart hover tooltips missing (bug)

## Status

Bug found while building the 034 batch. Not on the roadmap.

## What's broken

Hovering or tapping the Wealth Projection and Retirement Income charts
shows no tooltip. Release #31 (intents 030 to 032, v20) added a shared
`InfoTooltip` component. In the same release, both charts'
`React.createElement(Tooltip, { content: ChartTooltip })` became
`React.createElement(InfoTooltip, ...)`, probably through a find-and-replace.
Recharts ignores children it doesn't recognise, so the charts lost their
tooltips, including the "Total (today's money)" line from intent 013.
Found by `git log -S` while reading the chart code.

## Decision

Point both charts back at Recharts' `Tooltip`, imported under the
unambiguous name `ChartHoverTooltip` so the two can't be confused again.
No other change.
