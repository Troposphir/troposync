# troposync

A launcher, updater, news checker and general companion to the game Atmosphir, or rather,
to the Troposphir server for said game.

It uses Electron and Angular as a frontend strategy, and the shared code is just plain Node. 
Everything is written in TypeScript.

## Installation

This project uses [electron-forge](https://github.com/electron-userland/electron-forge) as its 
build and deploy tool, so you'll have to install that on your system. On the project root, run:

```sh
npm install --global electron-forge
npm install
```

To run the application, just `electron-forge start`, which will take care of compiling everything 
properly. In development you can use Ctrl+R to reload the webpage of the current window for faster 
iterations (note that this does not reload any code outside the browser window environment, 
e.g. `index.ts` and the like!)

## Running the server

To start the APIs up, just use:

```sh
npm run serve
```

## Configuring filesystem in development

If you're running in development with the intention on working on the updater code, 
you'll need to setup the filesystem:

Create the following directory structure:

    project root/
    |-depot/**/.sync/
    | |-base/
    |   |-status.json
    |-.sync/
    | |-status.json
    |-sync.json
    
There are a few key parts here:

 - `depot/` This is the **server** project root, each folder inside it is a client-module.
   Each folder in `depot/**/.sync/`is a release, and the file `status.json` describes the 
   versions that each release represents. You will need at least one release configured 
   to successfully test the updater.
 - `.sync/` This is the **client** update root, you just need the `status.json`, configure whatever modules
   you want to use there. The convention is the first module is called "base", but this isn't enforced.
   You'll need to configure at least one module to use the updater.
 - `sync.json` Here lies the general launcher configuration, you can copy a default one from
   `sync.example.json`. The server uses the example port by default.
 
## The `status.json` files

These files configure the project, and are quite simple currently:

```js
{
    //List of modules, order is significant: they are applied top-to-bottom.
    "modules": [
        {
            //The folder which in which the module is stored
            "name": "ExampleModule",
            
            //Current version of the contents of this module
            "version": "0.0.1",
            
            //When enabled, files will copied to the gameRoot, 
            //otherwise it's the same as omitting this module definition
            "enabled": false
        },
         
        /* ... more modules... */
    ]
}
```

In the depot, they have a heavily altered terminology: 
 
 - Each folder in the depot is equivalent to a module in the client
 - Modules in the depot are release deltas (contain all changed files for that version)
 - Entries in the `status.json` should be ordered by version, otherwise funky things may happen
 