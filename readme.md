Pattern Lab Basic Setup
=======================
by Sebastian Schlapkohl

> a blueprint implementation of a complete Pattern Lab setup to be used
> when starting a new project using ES6, SCSS and Twig (and, sadly, a little bit PHP)



What is this?
-------------
Starting a new pattern lav is tedious. It seemingly involves 321 steps, starting with docker setup, getting
the dependencies together, thinking about a task runner, source compilation, watchers, a dev server, logging,
and so on and so forth. Not even mentioning reading docs for a day to find sane defaults configs for everything.

This project aims to provide you with a complete setup, bundling all necessary things for modern static web
development, aiming at industry standard CMS, while also providing some demo content to use as a starting point
for your own project.



What is a pattern lab?
----------------------
A [pattern lab](https://patternlab.io/) is a browsable collection of UI components, which can be used to build a
website or web application.

Usually a pattern lab is built according to [atomic design](http://atomicdesign.bradfrost.com/) principles and consists
of atoms, molecules, organisms, which, in turn, are used to build templates and pages.

These categories are presented as such in the pattern lab, and thereby describe a way of building a website
using reusable and recombinable elements of rising complexity. Additionally, the pattern lab is a place for
documentation, manual as well as automatically generated things like an element hierarchy.

Originally, the pattern lab was never meant to produce production-ready code, but in practice, at least the compiled
JS and CSS is written for production use, while the templates remain a blueprint for CMS-implementations. To stay
close to most industry standards, we chose Twig as the templating engine here, since this dialect is
wide-spread in many implementations.

Data is represented as JSON files in pattern lab, allowing for modelling pattern-consumable data in a way,
that backend developers can easily understand and adapt, while also offering the possibility to easily define
pattern variants in the pattern lab, by just defining different data files, using the same template.

Style and script languages are not really part of the pattern lab idea, but since we aim to provide
production-ready code in this regard, we decided on ES6 and SCSS as dialects using
[Esbuild](https://esbuild.github.io/) and [Dart-Sass](https://sass-lang.com/), which can easily be switched to
TypeScript and indented Syntax if needed (or removed).



How do I start my own pattern lab based on this?
------------------------------------------------
1. Copy/fork this repo.
2. Edit `docker-compose.yml`.
   - change names of containers and images
   - change project name and development domain in the environment vars
3. Edit `package.json`.
   - change the project name and author
   - change the license (don't forget the license file)
   - add the browserslist you want to compile for
4. Edit `patternlab-config.json`
   - add your project's breakpoints to `ishViewportRange`
   - change options accoring to [documentation](https://patternlab.io/docs/editing-the-configuration-options/),
     but keep an eye out for comments for values you should not change
5. Edit `app/env/defines.js`
   - change `PROJECT_NAME` to your project's name
   - change `PROJECT_PREFIX` to a technical prefix for your project,
     which will be used for constants and storage names
6. Maybe base your readme on this file, but be careful to remove all the stuff that is not relevant to your project
   and adapt the project naming and description
7. Rework demo patterns into something representative for your project.



Development environment
-----------------------

### Setup

To get the project up and running, you'll need Docker as well as the `docker compose`-CLI-tool.

[Docker Versions](https://www.docker.com/community-edition#/download)

To create the dev environment, switch to the root folder of the project (where the `docker-compose.yml` is located)
and run

```bash
./bin/create.sh
```

This should download all necessary images and create our containers.

Afterwards, install dependencies with

```bash
./bin/install.sh
```

which should install all packages defined in `package.json` and fill the project's `node_modules`. Strictly speaking,
this step is not really necessary, because `install` gets called automatically on "start" and "build", but it's good
to understand what's happening here.

The repo consist of two code levels:
- the "host" level, which is everything above `/project`, which defines the IDE and host context
- and the  "project" level, which is everything inside `/project`, which gets mounted into the container and
  contains all the actual project files and code; this is where you write code and docker does its thing



### Start

To start the development environment, use

```bash
./bin/start.sh
```

which should start the container(s) via `docker compose` providing a built pattern lab with a running dev server
and file watchers being active, that trigger reloads on file changes.

The pattern lab is automatically started in "incremental" mode, which means, that everything get built cleanly
once on startup and from then on, we only try to build things, that actually changed.

After startup, the patternlab should be available at

```
https://pattern-lab-basic-setup.local-development.com
```

(replace the domain with your respective development domain)

Make sure to add this domain to your hosts file

```
127.0.0.1    pattern-lab-basic-setup.local-development.com
```

and restart your browser afterwards to make this change take effect.

Hint: since we are using a *self-signed certificate*, you will see a warning screen on first access, which you have
to skip in order to load the pattern lab.



### Managing the Docker container

Terminate execution with `CTRL+C` in the terminal window, where the container is running.

Sometimes using `CTRL+C` might result in an "abort" error message, in that case, to really
stop the process, use `docker compose stop`.

In order to get a shell on the running container, run

```bash
./bin/ssh.sh
```

in a separate terminal window.

To start the container and enter the shell thereafter, use

```bash
./bin/shell.sh
```



### Scripts

We have prepared all basic project actions as  shell scripts in `/bin`.
You may add a `/bin/local` folder for testing things locally. This folder will not be checked in.



### Managing dependencies

To add a dependency use either `./bin/ssh.sh` or `./bin/shell.sh` to open a bash in the app container and
simply add the dependency directly with yarn:

```bash
yarn add mypackagename --dev
```

This will automatically update `node_modules`, `package.json` and all lock files.

If other people have added dependencies, don't worry starting the project automatically checks dependencies
and updates if necessary. If you'd like to trigger an update manually, use

```bash
./bin/install.sh
```

Always check and adapt your version definition strings in `package.json` after adding a dependency:
- `^` is for minor updates, which might break things in edge cases, so use this only for runtime packages
  of the development environment, such as logging and file system tool
- `~` is for patch updates, which should not break anything, so use this for dev packages, which generated code
  which gets shipped to the client, such as postcss, terser, esbuild, etc.
- use fixed versions for client packages, that are delivered to the client directly, these should not change in any
  way if you did not plan for it, because this might break your app on the client side
  (it might also be a good idea to used fixed versions for things that are central to the project and are not
  easily tested or might include client code somewhere hidden, such as the pattern lab packages themselves)



### @client package separation

It may be a good idea, to generally split node and client packages up.

Why?

Client packages are delivered directly to the client and are executed and interpreted on the user's machine.
So, these packages have a different set of rules applying to them.

For example: it is not really clever to give client packages an approximate version, like a normal node dependency
using `^` or `~`, because every minor change in a client package may affect all receiving clients after a reevaluation
of NPM versions. This is a nightmare, because this means, that, at undetermined points in time, all cross-browser
testing you did may be invalid and since you are not seeing everything while developing all the time, your app may
fall apart on certain devices, without you knowing.

Another problem is the sharing of packages between dev/build/hosting and frontend/client.

Let's say both use lodash or q promises: both have to agree on the exact same version, that should not be changed
frequently because of the aforementioned problems. That is very unpractical for both usages and each should be able to
use the version fitting its purpose, since they are used for different things on very different machines, even if it is
the same package under the hood.

So I generally propose separating all npm packages, that are delivered to the client directly in any way into a specific
`@client` package in `node_modules` using fixed versioning for these (I originally got the idea when I transitioned)
from Bower to NPM, reading the Bower team's [ideas](https://bower.io/blog/2017/how-to-migrate-away-from-bower/) about
this.

So, I propose to generally use an alias location for client packages, such as this:

```json
{
    "dependencies": {
        "@client/dompurify": "npm:dompurify@3.0.5",
        "@client/lodash-es": "lodash/lodash#4.17.21-es"
    }
}
```



### Extending Twig

If you ever feel the need to add functionality to Twig, you can do so using the `alter-twig.php` file generated
and used by the pattern lab. It contains an environment to extend the engine with all sorts of things and examples as
well.



### Dummy Images

To create self-documenting pattern images we automatically create dummy images to use in patterns in a default format.
These are discernible per breakpoint by their background color and should contain all necessary information about their
size (dimensions) and aspect ratio as text on the image itself. By doing this every element tells all interested parties
how to produce a content image for a specific location.

To use dummy images they have to be created/downloaded beforehand.

To add a new image type, define the new type in `patternlab-config.json` under `additions.dummyImages.configs`.

For example:

```
"configs" : [
    {
        "name" : "asset",
        "small" : {
            "width" : 100,
            "height" : 100,
            "text" : "100 x 100 - 1:1"
       },
       "medium" : {
           "width" : 400,
           "height" : 300,
           "text" : "400 x 300 - 4:3"
       },
       "large" : {
           "width" : 1600,
           "ar" : "16/9",
           "text" : "1600 x 900 - 16:9"
       }
    }
]
```

After this you can trigger the download by executing

```bash
./bin/download-dummyimages.sh
```

Now your new dummy image type is ready to use in a template.

Based on these pattern variant JSON data examples

```json
{
    "image" : "asset"
}
```

or manually

```json
{
    "image" : {
        "alt": "asset",
        "image": {
            "small": "/img/dummy-images/asset-small.png",
            "small2x": "/img/dummy-images/asset-small@2x.png",
            "medium": "/img/dummy-images/asset-medium.png",
            "medium2x": "/img/dummy-images/asset-medium@2x.png",
            "large": "/img/dummy-images/asset-large.png",
            "large2x": "/img/dummy-images/asset-large@2x.png"
        }
    }
}
```

we can use dummy images transparently in our templates like this:

```twig
{{ pattern('atoms/content-image', {image : content_image('asset')}) }}
```

What we did here:

We wrote twig helpers to automatically handle dummy images transparently.

Both JSONs are valid, but if the helper function gets a string as the parameter it automatically builds a JSON
of the second type with the standard format for dummy images and returns this, whereas if the parameter is not a
string it will be used as-is.

By doing this, we can define a dummy image type using a unique name and afterwards just reference the image
by name, while also keeping the possibility to actually use content images and manually defined images at the same place
without having to alter the template.

To make it even more comfortable, we added this behavior automatically to the "content image" atom as well as to the
"image" molecule, so you could also just do

```twig
{{ pattern('atoms/content-image', image) }}
```



### Extending the render engine

You may add new functionality to the render engine(s), by adding stuff to the extension files inside the
`render-engines` folder.

Either use
- `render-engines/twig/twig-extensions.php` for the Node-based Twig engine (default)
- `render-engines/twig-php/twig-php-extensions.php` for the PHP-based Twig engine
- `render-engines/handlebard/handlebars-extensions.php` for the pattern-lab-integrated Handlebars engine



### Using other template engines

By default, this project uses a Twig renderer based on Node, called ["Twing"](https://twing.nightlycommit.com/),
but if you'd rather go with the default PHP renderer or Handlebars, that's easy to do as well.

#### TwigPHP

To switch to TwigPHP, you'll have to do these things:

1. Add the PHP CLI in `docker/pattern-lab/dockerfile`.
   - add the contents of `render-engines/twig-php/install-php-cli.sh` (`apt-get install -y php-common php-cli`)
     directly before `apt-get clean`
2. Add the PHP renderer `package.json`
   - add the dependency in `render-engines/twig-php/package.json` (`"@pattern-lab/engine-twig-php"`)
     to the `devDependencies`
3. Add the engine to `patternlab-config.json`
   - add the engine definition inside `render-engines/twig-php/patternlab-config.json`
     to the `engines` array inside the project's `patternlab-config.json`
4. Remove the Node Twig engine (from `patternlab-config.json`, and optionally also from `package.json`)

After these changes, don't forget to `./bin/create.sh` and to `./bin/install.sh` to get the new engine up and running.



#### Handlebars

Switching to Handlebars is very straightforward, since it is a core dependency of pattern lab and installed and
active as an engine anyway:

Just remove all other engines from `patternlab-config.json` and you should be good to go.

Optionally, you can remove the Node Twig engine from `package.json` as well.



Building and deployment
-----------------------

### For the pattern lab itself

To generate the static artifact of the pattern lab itself in `/public`, which can be statically hosted anywhere
and contains the complete pattern lab as a website, use

```bash
./bin/build.sh
```



### For production

The generate production-ready assets for a CMS in `/public`, use

```bash
./bin/build-production.sh
```
