# Contributing

Thank you for considering making contributions to Cosmy Wasmy!

There are two ways you can contribute to the extension:
1. Code contributions - Bug fixes, new features, refactors etc
2. Localization contributions - Add support for languages beyond English

## 1. Code Contributions

The general procedure for contributing is:

1. Start by browsing [new issues](https://github.com/spoo-bar/cosmy-wasmy/issues).
   * Looking for a good place to start contributing? How about checking out some [good first issues](https://github.com/spoo-bar/cosmy-wasmy/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) or [bugs](https://github.com/spoo-bar/cosmy-wasmy/issues?q=is%3Aopen+is%3Aissue+label%3Abug)?
   * Create an issue if you have an interesting idea you would like included in the extension
2. Comment on the issue that you would like to work on it. Once you have been assigned to the Github issue, you can start with the item. (This is to ensure the item isnt actively being worked on already)
3. To submit your work as a contribution to the repository follow standard GitHub best practices. See [pull request guideline](#pull-requests) below.

**Note:** For very small or blatantly obvious problems such as typos, you are
not required to an open issue to submit a PR.


### Pull Requests

Before submitting a pull request:

* merge the latest main `git merge origin/main`

Then:

1. As soon as you have something to show, **start with a `Draft` PR**.  Draft PRs helps provide early feedback and ensure the work is in the right direction.
2. When the code is complete, change your PR from `Draft` to `Ready for Review`.
3. Be sure to include a relevant changelog entry in the `Unreleased` section of `CHANGELOG.md` (see file for log format). The entry should be on top of all others changes in the section.

PRs name should start upper case.
Additionally, each PR should only address a single issue.

## 2. Localization contributions

The general procedure for contributing language translation is:

1. For the extension configurations:
    
    This applies for static text in Settings and Command titles and Extension walkthroughs which is configured in `package.json`.
    * Create a `./package.nls.{locale}.json` in the root of the repository. 
    * Copy all the keys from `./package.nls.json` into this new file.
    * Add translated values to all the keys

    Currently, there are about ~100 keys which need to be translated for `package.json`. If a value is not provided for a certain key, the English translation is used.

2. For the code translations

    This applies for text such as errors which are conditional and are displayed as part of execution of the extension code.
    * Run `npx @vscode/l10n-dev export -o ./l10n ./src` from the root of the repository
    * You will now have a `./l10n/bundle.l10n.json` which will show you all the localizable strings in the code
    * Rename the file to `bundle.l10n.{locale}.json` and start replacing the translations

    Currently, there are about ~130 keys which need to be translated. If a value is not provided for a certain key, the English translation is used.

3. Create a PR with your translations


Find more details on how the localization in vscode extensions works [here](https://github.com/microsoft/vscode-l10n).