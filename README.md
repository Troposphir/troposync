# troposync

A launcher, updater, news checker and general companion to the game Atmosphir, or rather, to the Troposphir server for said game.

It uses Electron and Angular as a frontend strategy, and the shared code is just plain Node. Everything is written in TypeScript.

## Installation

This project uses [electron-forge](https://github.com/electron-userland/electron-forge) as its build and deploy
tool, so you'll have to install that on your system. On the project root, run:

```sh
npm install --global electron-forge
npm install
```

To run the application, just `electron-forge start`, which will take care of compiling everything properly.
In development you can use Ctrl+R to reload the webpage of the current window for faster iterations
(note that this does not reload any code outside the browser window environment, e.g. `index.ts` and the like!)

## Running the server

To start the APIs up, just use:

```sh
npm run serve
```