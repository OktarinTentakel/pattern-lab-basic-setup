---
title: Content Image
order: 1
state: complete
---
Standard responsive image for all viewports. This pattern supports all viewports of the project
(small, medium, large), which can be provided in normal and doubled pixel density
(by providing an image version with exactly twice the dimensions of the normal variant).

We are presuming that any content image has a defined width (the default value is 100%) and therefore automatically
resulting in higher pixel density if 2x image variants are defined. In case the image has no defined width using
high density versions might result in displaying the image in twice the size in the layout.

Hint: You may also use SVGs as sources for this element, which would be the right choice for detailed graphics as
graphs. You can also define a different version of the SVG for each breakpoint analogous to the pixel-based formats.
