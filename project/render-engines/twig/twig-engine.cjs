//###[ IMPORTS ]########################################################################################################

const
	fs = require('node:fs'),
	path = require('node:path'),
	{
		createEnvironment,
		createFilesystemLoader,
		createChainLoader,
		createSource
	} = require('twing'),
	globalData = require('/project/source/_data/data.json')
;



//###[ HELPERS ]########################################################################################################

function findFile(dir, fileName){
	const files = fs.readdirSync(dir);

	for( const file of files ){
		const
			filePath = path.join(dir, file),
			fileStat = fs.statSync(filePath)
		;
		if( fileStat.isDirectory() ){
			const file = findFile(filePath, fileName);
			if( !!file ){ return file; }
		} else if( file.endsWith(fileName) ){
			return filePath;
		}
	}

	return undefined;
}



//###[ LOADER ]#########################################################################################################

class PatternLabLoader {

	constructor(){
		this.patterns = new Map();
		this.namespaces = new Map();
	}


	registerPartial(pattern){
		if( !!pattern.patternPartial ){
			this.patterns.set(pattern.patternPartial, pattern);
		}
	}



	getSource(name){
		if( name.startsWith('@') ){
			const nameParts = name.substring(1).split('/');
			name = `${nameParts[0]}-${nameParts[1]}`;
		} else if( name.includes('/') ){
			const nameParts = name.split('/');
			name = `${nameParts[0]}-${nameParts[nameParts.length-1]}`;
		}

		if( name.endsWith('.twig') ){
			name = name.substring(0, name.length-5);
		}

		const
			pattern = this.patterns.get(name),
			template = pattern.extendedTemplate
		;

		return Promise.resolve(createSource(name, template));
	}



	getCacheKey(name){
		return Promise.resolve(name);
	}



	isFresh(name){
		return Promise.resolve(false);
	}



	exists(name){
		return Promise.resolve(this.patterns.has(name));
	}



	resolve(){
		return Promise.resolve(null);
	}
}



//###[ ENGINE ]#########################################################################################################

class TwigEngine {

	constructor(){
		this.fileSystemLoader = createFilesystemLoader(fs);
		this.patternLabLoader = new PatternLabLoader();

		this.engineName = 'twig';
		this.engineFileExtension = '.twig';
		this.reload();

		this.findPartialsRE = /{[%{]\s*.*?(?:extends|include|embed|from|import|use|pattern)\(?\s*['"](.+?)['"][\s\S]*?\)?\s*[%}]}/g;
		this.metaPath = null;
		this.namespaces = {};
		this.config = {};

		this.setupExtensions = null;
	}



	reload(){
		this.engine = createEnvironment(
			createChainLoader([
				this.fileSystemLoader,
				this.patternLabLoader,
			]),
			{
				globals : globalData
			}
		);

		if( typeof this.setupExtensions === 'function' ){
			this.setupExtensions(this.engine);
		}
	}



	renderPattern(pattern, data){
		let patternPath = pattern.relPath;

		if( patternPath.startsWith(this.metaPath) ){
			patternPath = patternPath.substring(this.metaPath.length+1);
		}

		if( patternPath.endsWith('.json') ){
			if( patternPath.includes('~') ){
				patternPath = `${patternPath.split('~')[0]}${this.engineFileExtension}`;
			} else {
				patternPath = `${patternPath.substring(0, patternPath.length-5)}${this.engineFileExtension}`;

			}
		}

		return this.engine.render(patternPath, data);
	}



	registerPartial(pattern){
		this.patternLabLoader.registerPartial(pattern);
	}



	findPartials(pattern){
		const matches = pattern.template.match(this.findPartialsRE);
		return matches && matches.filter(match => {
			// Filter out programmatically created includes.
			// i.e. {% include '@namespace/icons/assets/' ~ name ~ '.svg' %}
			return match.indexOf('~') === -1;
		});
	}



	findPartial(partialString){
		try {
			let partial = partialString.replace(this.findPartialsRE, '$1');

			if(
				partial.startsWith('atoms/')
				|| partial.startsWith('molecules/')
				|| partial.startsWith('organisms/')
			){
				partial = `@${partial}.twig`;
			}

			const
				selectedNamespaces = Object.keys(this.namespaces).filter(namespace => partial.includes(`@${namespace}`)),
				selectedNamespace = (selectedNamespaces.length > 0) ? selectedNamespaces[0] : null,
				selectedNamespacePath = !!selectedNamespace ? path.resolve(this.namespaces[selectedNamespace]) : null
			;

			let namespaceResolvedPartial = '';
			if( !!selectedNamespacePath ){
				const partialFile = findFile(selectedNamespacePath, partial.split('/')[1]);
				if( !!partialFile ){
					namespaceResolvedPartial = partialFile.replace(selectedNamespacePath, selectedNamespace);
				}
			}
			return namespaceResolvedPartial || partial;
		} catch(ex){
			console.error(`Error "${ex}" occured when trying to find partial name in: ${partialString}`);
			return null;
		}
	}

	findPartial_new(){
		return null;
	}



	findPartialsWithPatternParameters(){
		return null;
	}



	findListItems(pattern){
		return null;
	}



	spawnMeta(config){}



	usePatternLabConfig(config){
		this.config = config;
		this.metaPath = path.resolve(config.paths.source.meta);

		this.fileSystemLoader.addPath(config.paths.source.meta);
		this.fileSystemLoader.addPath(config.paths.source.patterns);

		if( !!config.engines?.twig ){
			const namespaces = config.engines.twig.namespaces;
			if( !!namespaces ){
				this.namespaces = namespaces;
				for( const namespaceName in namespaces ){
					this.fileSystemLoader.addPath(namespaces[namespaceName], namespaceName);
				}
			}
		}

		if( !!config.engines.twig.extend ){
			this.setupExtensions = require(config.engines.twig.extend);
			this.setupExtensions(this.engine);
		}
	}

}



const engine = new TwigEngine();
module.exports = engine;
