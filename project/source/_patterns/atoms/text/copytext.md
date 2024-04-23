---
title: Copytext
order: 7
state: complete
---
This is the essential pattern for displaying content text. This text may either be a plain text without further
structuring or may itself contain basic HTML markup for structuring contents on a basic level.

The possibilities here include:
+ paragraphs (`<p>`)
+ (un)ordered lists (`<ul>`/`<ol>`)
+ inline links (`<a>`)
+ text decorations (`<b>`/`<strong>`/`<small>`/`<i>`/`<em>`/`<u>`/`<s>`/`<strike>`)

Paragraphs, lists and other block elements must be on the first level of the copytext and may _not_ be nested, while
inline markup such as links and decoration work everywhere.

Keep in mind, that copytext offers styling via markup, but only in a very narrow and defined scope. Things like
tables and iframes are not to be included here at the moment.

To use a fully structured small copytext, use the small type of this pattern and do _not_ just try to use `<small>`
everywhere.
