---
nav_order: 7
permalink: /contribute
---

# Contribute

I'm really glad you're reading this, because contributions are always welcome!

Here are some important resources you can use to get familiar with Nick:

- [Official Website](https://nickcms.org) contains generic information
- [Documentation](https://docs.nickcms.org) has our Rest API documentation
- [Online Demo](https://demo.nickcms.org) can be used to play around with Nick
- [Issue Tracker](https://github.com/robgietema/nick/issues) is where you report
  bugs and feature requests

## Translations

Currently Nick is available in multiple languages. Feel free add missing
translations or add a new language. The translations can be found in the
`locales` folder and you can extract new translatable text using the `pnpm i18n`
command. This command also builds the language files for use with Nick.

## Testing

We have several unit and integration tests in place which cover most of the
code. Of course this can be improved and more tests are always welcome. If you
do any manual testing feel free to submit a bug or feature request in our
[Issue Tracker](https://github.com/robgietema/nick/issues) on Github.

## Submitting changes

Please send a [Pull Request](https://github.com/robgietema/nick/pulls) with a
clear list of what you've done. We can always use more test coverage so don't be
shy to add them. Please follow our coding conventions (below) and make sure all
of your commits are atomic (one feature per commit). Always write a clear log
message for your commits. And last but not least make sure all the automated
checks pass so we can easily merge your Pull Request.

## Coding conventions

Start reading our code and you'll get the hang of it. We optimize for
readability:

- We indent using two spaces (soft tabs)
- We use prettier to format our Javascript and JSON files
- All public facing text should be translatable, see our code for example on
  how to make text translatable in both Javascript and JSON
- This is open source software. Consider the people who will read your code, and
  make it look nice for them. It's sort of like driving a car: Perhaps you love
  doing donuts when you're alone, but with passengers the goal is to make the
  ride as smooth as possible.
