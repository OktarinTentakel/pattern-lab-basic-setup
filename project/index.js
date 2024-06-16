//###[ IMPORTS ]########################################################################################################

import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import {deleteAsync as del} from 'del';
import task from 'tasuku';
import yargs from 'yargs';
import patternLabFactory from '@pattern-lab/core';
import {Roarr as log} from 'roarr';
import patternLabLogger from '@pattern-lab/core/src/lib/log.js';
import outdent from 'outdent';
import browserSync from 'browser-sync';
import compression from 'compression';
import * as esbuildFactory from 'esbuild';
import * as sassFactory from 'sass-embedded';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import Watcher from 'watcher';



//###[ CONFIGS ]########################################################################################################

import patternLabConfig from './patternlab-config.json' assert {type : 'json'};



//###[ ARGV ]###########################################################################################################

const
	argv = yargs(process.argv).argv,
	PROJECT = (
		!!argv.environment
		&& (`${argv.project}`.trim() !== '')
	)
		? `${argv.project}`.trim()
		: '[missing project name, change me via PROJECT env var in docker-compose.yml]'
	,
	ENVIRONMENT = (
		!!argv.environment
		&& (`${argv.environment}`.trim() !== '')
		&& ['dev', 'pl', 'prod'].includes(`${argv.environment}`.trim())
	)
		? `${argv.environment}`.trim()
		: 'dev'
	,
	HOST = (
		!!argv.host
		&& (`${argv.host}`.trim() !== '')
	)
		? `${argv.host}`.trim()
		: '0.0.0.0'
	,
	DEVDOMAIN = (
		!!argv.devdomain
		&& (`${argv.devdomain}`.trim() !== '')
	)
		? `${argv.devdomain}`.trim()
		: null
	,
	PORT = (
		!!argv.port
		&& (`${argv.port}`.trim() !== '')
	)
		? parseInt(`${argv.port}`.trim(), 10)
		: 443
	,
	PROTOCOL = (
		!!argv.protocol
		&& (`${argv.protocol}`.trim() !== '')
		&& /https?/.test(`${argv.protocol}`.trim())
	)
		? `${argv.protocol}`.trim()
		: 'https'
;



//###[ CONSTANTS ]######################################################################################################

const
	PL_INCLUDE_PATHS = [
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	JS_INCLUDE_PATHS = [
		path.resolve('./node_modules/@client'),
		path.resolve(patternLabConfig.paths.includes.app),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	SCSS_INCLUDE_PATHS = [
		path.resolve('./node_modules/@client'),
		path.resolve(patternLabConfig.paths.includes.styles),
		path.resolve(patternLabConfig.paths.source.patterns),
	],
	ESBUILD_CONFIG = {
		nodePaths : JS_INCLUDE_PATHS,
		target : browserslistToEsbuild(),
		define : {
			__ENVIRONMENT__ : `'${ENVIRONMENT}'`
		},
		bundle : true,
		minify : true,
		sourcemap  : true,
		sourcesContent : (ENVIRONMENT !== 'prod'),
		entryPoints : [path.resolve(patternLabConfig.paths.includes.app, 'index.js')],
		outfile : path.resolve(patternLabConfig.paths.public.root, 'js', 'app.js'),
	},
	SASS_CONFIG = {
		style : 'compressed',
		loadPaths : SCSS_INCLUDE_PATHS,
		sourceMap : true,
		sourceMapIncludeSources : (ENVIRONMENT !== 'prod'),
	},
	WATCHER_CONFIG = {
		ignoreInitial : true,
		recursive : true,
	},
	WATCHER_EVENTS = ['add', 'change', 'unlink'],
	BROWSER_SYNC_CONFIG = {
		server : {
			baseDir : path.resolve(patternLabConfig.paths.public.root),
			middleware : compression()
		},
		host : HOST,
		port : PORT,
		https : PROTOCOL === 'https',
		cors : true,
		open : false,
		ghostMode : false,
		ui : false,
		snippetOptions : {
			// not for the pattern lab frame itself
			blacklist : ['/index.html', '/', '/?*']
		},
		logLevel : 'silent',
		logConnections : false,
		logFileChanges : false,
		logSnippet : false,
	}
;



//###[ PROVIDERS ]######################################################################################################

const
	patternLab = patternLabFactory(patternLabConfig),
	{default : twigEngine} = await import('./render-engines/twig/twig-engine.cjs'),
	server = browserSync.create(),
	esbuild = await esbuildFactory.context(ESBUILD_CONFIG),
	sass = sassFactory.initCompiler()
;

let
	patternLabBuildCount = 0,
	appWatcher,
	stylesWatcher
;



//###[ HELPERS ]########################################################################################################


function defineTasukuLogging(){
	const ROARR = globalThis.ROARR = globalThis.ROARR || {};

	ROARR.write = message => {
		console.log(message);
	};
}



// if a task ends too fast, tasuku might not get to the point of showing the task status,
// in those cases, delay the task a little bit
async function delayTasukuTask(delay=250){
	return new Promise(resolve => {
		setTimeout(() => { resolve(); }, delay);
	});
}



function definePatternLabLogging(){
	//patternLabLogger.log.on('debug', message => { log.debug(message); });
	patternLabLogger.log.on('info', message => {
		if( message.startsWith('Found a lower common denominator pattern state') ) return;
		log.info(message);
	});
	patternLabLogger.log.on('warning', message => { log.warn(message); });
	patternLabLogger.log.on('error', message => { log.error(message); });
}



function showStartUpDisplay(task){
	let message = outdent`\n\n
		////////////////////////////////////////////////////////////
		|||
		|||  Starting the "${PROJECT}" pattern lab.
		|||
		|||  Current runtime context:
		|||  - task: ${task}
		|||  - environment*: ${ENVIRONMENT}
		|||
		|||  * can be either "dev", "pl" or "prod"
		|||   "dev" is for local development
		|||   "pl" is for the pattern lab deployment
		|||   "prod" is for production deployment of assets to a CMS
		|||
	\n`;

if( task === 'start' ){
	message += outdent `
		|||  The development server will be available at:
		|||  ${PROTOCOL}://${HOST}:${PORT}${DEVDOMAIN
	?'\n|||'
	+'\n|||  A dev domain has been defined, add this to you hosts file:'
	+'\n|||  127.0.0.1\t'+DEVDOMAIN
	+'\n|||'
	+'\n|||  Access the development server via:'
	+'\n|||  '+PROTOCOL+'://'+DEVDOMAIN+':'+PORT+'/'
	:'\n|||'}${(PROTOCOL === 'https')
	?'\n|||'
	+'\n||| (We are using a self-signed SSL certificate,'
	+'\n||| so you will have to skip a warning in the browser.)'
	:'\n|||'}
		|||
	\n`;
}

	message += outdent`
		\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	\n`;

	log.info(message);
}



async function clearPublic(){
	await del(path.join(path.resolve(patternLabConfig.paths.public.root), '**/*'));
}



async function removeDependencyGraph(){
	await del(path.resolve(patternLabConfig.paths.root, 'dependencyGraph.json'));
}



async function removeNonTwigMetaTemplates(){
	// pattern lab always renders meta templates such as head and foot
	// for all installed engines, not just selected one, so we remove the unused
	// syntaxes after start here once, since they do not get re-rendered after watch build
	const basePath = patternLabConfig.paths.source.meta;
	await del(path.resolve(basePath, '*.hbs'));
	await del(path.resolve(basePath, '*.mustache'));
}



async function downloadFile(url, filePath){
	return new Promise((resolve, reject) => {
		if( !fs.existsSync(path.dirname(filePath)) ){
			fs.mkdirSync(path.dirname(filePath), {recursive : true});
		}

		const file = fs.createWriteStream(filePath);

		const request = https.get(url, response => {
			if( response.statusCode >= 400 ){
				reject(`HTTP error ${response.statusCode}`);
			}

			response.pipe(file);
		});

		file.on('finish', () => {
			file.close(() => { resolve(); });
		});

		request.on('error', error => {
			fs.unlink(filePath, () => { reject(error.message); });
		});

		file.on('error', error => {
			fs.unlink(filePath, () => { reject(error.message); });
		});
	});
}



//###[ TASK DEFINITIONS ]###############################################################################################

function publishPatternLab(){
	return task('publishing pattern lab', async({setStatus, setOutput}) => {
		setStatus('publishing');

		await patternLab.build({cleanPublic : true});

		await removeNonTwigMetaTemplates();

		const message = outdent`pattern lab build finished`;
		log.info(message);
		setOutput(message);

		setStatus('published');
	});
}



function buildPatternLab(message=null, cleanPublic=true){
	return task('building pattern lab', async({setStatus, setOutput}) => {
		setStatus('building');

		patternLab.events.on('patternlab-build-end', () => {
			twigEngine.reload();
		});

		patternLab.events.on('patternlab-build-end', () => {
			patternLabBuildCount++;
			const message = outdent`pattern lab build [${patternLabBuildCount}] finished`;
			log.info(message);
			setOutput(message);
			server.reload();
		});

		await patternLab.build({cleanPublic});

		await removeNonTwigMetaTemplates();

		setStatus('built');

		if( message ){
			setOutput(message);
		}
	});
}



function buildApp(message=null){
	return task('building app', async({setStatus, setOutput}) => {
		setStatus('building');

		await esbuild.rebuild();

		setStatus('built');

		if( message ){
			setOutput(message);
		}
	});
}



function buildStyles(message=null){
	return task('building styles', async({setStatus, setOutput}) => {
		setStatus('building');

		const
			entrySource = fs.readFileSync(path.resolve(patternLabConfig.paths.includes.styles, 'index.scss'), 'utf8'),
			result = sass.compileString(
				`$__ENVIRONMENT__: ${ENVIRONMENT};\n${entrySource}`,
				SASS_CONFIG
			)
		;

		const targetPath = path.resolve(patternLabConfig.paths.public.root, 'css');
		if( !fs.existsSync(targetPath) ){
			fs.mkdirSync(targetPath);
		}
		const transformedResult = await postcss([autoprefixer]).process(result.css, {from : undefined});
		transformedResult.warnings().forEach(warn => {
			log.warn(warn.toString());
		});
		fs.writeFileSync(
			path.resolve(targetPath, 'app.css'),
			`${transformedResult.css}\n/*# sourceMappingURL=app.css.map */`
		);
		fs.writeFileSync(
			path.resolve(targetPath, 'app.css.map'),
			JSON.stringify(result.sourceMap, null, 2)
		);

		setStatus('built');

		if( message ){
			setOutput(message);
		}
	});
}



function build(){
	return Promise.allSettled([
		buildPatternLab(),
		buildApp(),
		buildStyles()
	]);
}



function serve(){
	return task('serving files', async({setStatus}) => {
		setStatus('intializing');

		await new Promise(resolve => {
			server.init(BROWSER_SYNC_CONFIG, () => {
				resolve();
			});
		});

		setStatus('serving');
	});
}



function watchPatternLab(){
	return task('watching pattern lab files', async({setStatus, setOutput, setError}) => {
		setStatus('watching');

		appWatcher = new Watcher(
			PL_INCLUDE_PATHS,
			WATCHER_CONFIG,
			async (e, targetPath) => {
				if(
					WATCHER_EVENTS.includes(e)
					&& /\.(twig|json|md)$/.test(targetPath)
				){
					const
						eventMessage = outdent`detected ${e}@${path.basename(targetPath)}`,
						rebuildMessage = outdent`built patterns, reloading ...`
					;

					log.info(eventMessage);

					try {
						await buildPatternLab(eventMessage, false);
					} catch(ex){
						setError(ex.message);
						if( ENVIRONMENT !== 'dev' ){
							throw ex;
						}
					}

					log.info(rebuildMessage);
					setOutput(outdent`${eventMessage} -> ${rebuildMessage}`);

					server.reload();
				}
			}
		);
	});
}



function watchApp(){
	return task('watching app files', async({setStatus, setOutput, setError}) => {
		setStatus('watching');

		appWatcher = new Watcher(
			JS_INCLUDE_PATHS,
			WATCHER_CONFIG,
			async (e, targetPath) => {
				if(
					WATCHER_EVENTS.includes(e)
					&& /\.(js)$/.test(targetPath)
				){
					const
						eventMessage = outdent`detected ${e}@${path.basename(targetPath)}`,
						rebuildMessage = outdent`rebuilt app, reloading ...`
					;

					log.info(eventMessage);

					try {
						await buildApp(eventMessage);
					} catch(ex){
						setError(ex.message);
						if( ENVIRONMENT !== 'dev' ){
							throw ex;
						}
					}

					log.info(rebuildMessage);
					setOutput(outdent`${eventMessage} -> ${rebuildMessage}`);

					server.reload('*.js');
				}
			}
		);
	});
}



function watchStyles(){
	return task('watching style files', async({setStatus, setOutput, setError}) => {
		setStatus('watching');
		stylesWatcher = new Watcher(
			SCSS_INCLUDE_PATHS,
			WATCHER_CONFIG,
			async (e, targetPath) => {
				if(
					WATCHER_EVENTS.includes(e)
					&& /\.(scss)$/.test(targetPath)
				){
					const
						eventMessage = outdent`detected ${e}@${path.basename(targetPath)}`,
						rebuildMessage = outdent`rebuilt styles, hot reloading ...`
					;

					log.info(eventMessage);

					try {
						await buildStyles(eventMessage);
					} catch(ex){
						setError(ex.message);
						if( ENVIRONMENT !== 'dev' ){
							throw ex;
						}
					}

					log.info(rebuildMessage);
					setOutput(outdent`${eventMessage} -> ${rebuildMessage}`);

					server.reload('*.css');
				}
			}
		);
	});
}



function watch(){
	return Promise.allSettled([
		watchPatternLab(),
		watchApp(),
		watchStyles()
	]);
}



function downloadDummyImages(){
	return task('downloading dummy images', async({setStatus, setOutput, setError}) => {
		setStatus('downloading');

		const
			dummyImages = [],
			dummyImageConfig = patternLabConfig.additions.dummyImages,
			viewports = ['small', 'medium', 'large'],
			sizes = [
				{factor : 1, suffix : ''},
				{factor : 2, suffix : '@2x'}
			]
		;

		for( const config of dummyImageConfig.configs ){
			if( !config.name ){
				setError('missing "name"');
				break;
			}

			for( const viewport of viewports ){
				for( const size of sizes ){
					const
						viewportConfig = config[viewport],
						aspectRatio = viewportConfig.ar
							? viewportConfig.ar.replace(/\//g, ':').split(':').reduce(
								(factor, divider) => {
									divider = parseInt(divider, 10);
									if( factor === 0 ) return divider;
									return factor / divider;
								},
								0
							)
							: (viewportConfig.height / viewportConfig.width)
						,
						width = viewportConfig.width * size.factor,
						height = viewportConfig.height
							? viewportConfig.height * size.factor
							: Math.round(viewportConfig.width * size.factor * (1 / aspectRatio))
						,
						filename = `${config.name}-${viewport}${size.suffix}.${dummyImageConfig.extension}`
					;

					// only add missing files
					try {
						fs.accessSync(
							path.resolve(patternLabConfig.paths.source.images, 'dummy-images', filename),
							fs.constants.F_OK
						);
					} catch(ex) {
						dummyImages.push({
							url : dummyImageConfig.baseUrl
								.replace('{width}', width)
								.replace('{height}', height)
								.replace('{text}', `${encodeURIComponent(viewportConfig.text)} - @${size.factor}x`)
								.replace('{background}', dummyImageConfig.colors.background[viewport])
								.replace('{foreground}', dummyImageConfig.colors.foreground[viewport])
								.replace('{extension}', dummyImageConfig.extension)
							,
							filename,
						});
					}
				}
			}
		}

		if( dummyImages.length > 0 ){
			const downloads = [];

			dummyImages.forEach(dummyImage => {
				downloads.push(downloadFile(
					dummyImage.url,
					path.resolve(patternLabConfig.paths.source.images, 'dummy-images',  dummyImage.filename)
				));
			});

			await Promise.allSettled(downloads);

			setOutput(`downloaded:\n${dummyImages.map(dummyImage => {
				return `${dummyImage.filename}\n`;
			}).join('')}`);
		} else {
			await delayTasukuTask();
			setOutput('all dummy images are present, delete files to re-download');
		}

		setStatus('downloaded');
	});
}



//###[ PRE UPSTART SETUP ]##############################################################################################

defineTasukuLogging();
definePatternLabLogging();



//###[ TASKS ]##########################################################################################################

switch( argv.task ){
	case 'start':
		showStartUpDisplay(argv.task);

		await Promise.allSettled([
			clearPublic(),
			removeDependencyGraph()
		]);

		await build();

		await Promise.allSettled([
			serve(),
			watch()
		]);
	break;

	case 'build':
		showStartUpDisplay(argv.task);

		await Promise.allSettled([
			clearPublic(),
			removeDependencyGraph()
		]);

		await Promise.allSettled([
			publishPatternLab(),
			build()
		]);

		process.exit(0);
	break;

	case 'download_dummyimages':
		showStartUpDisplay(argv.task);

		await downloadDummyImages();
		// for some reason these files also appear in non-pattern-lab tasks
		await removeNonTwigMetaTemplates();

		process.exit(0);
	break;

	default:
		log.error(outdent`unknown task "${argv.task}", make sure to define a task using --task=taskname`);
		// for some reason these files also appear in non-pattern-lab tasks
		await removeNonTwigMetaTemplates();

		process.exit(0);
	break;
}



//###[ POST UPSTART SETUP ]#############################################################################################

if( ENVIRONMENT === 'dev' ){
	// we do not want to kill the process on errors during dev, but rather log them, keeping the process alive,
	// allowing for retries with watcher-triggered rebuilds
	// this is especially the case for pattern lab errors occurring during watch
	process.on('uncaughtException', error => {
		log.error(`Unhandled exception: ${error}`);
		log.error('Stack:');
		log.error(error.stack);
	});

	process.on('unhandledRejection', (reason, promise) => {
		log.error(`Unhandled promise rejection at: ${promise}`);
		log.error(`With the reason: ${reason}`);
		log.error('Stack:');
		log.error(reason.stack);
	});
}
