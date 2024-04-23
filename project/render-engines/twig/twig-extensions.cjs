//###[ IMPORTS ]########################################################################################################

const
	{createFunction, createEmbedNode} = require('twing'),
	{parseArguments} = require('twing/dist/cjs/lib/tag-handler/include.js'),
	{Token} = require('twig-lexer')
;



//###[ EXTENSIONS ]#####################################################################################################

function setupExtensions(twing){

	twing.addFunction(createFunction(
		'debug',
		(context, target) => {
			try {
				return Promise.resolve(JSON.stringify(target, null, 4));
			} catch(ex){
				return Promise.resolve('debug: target not serializable');
			}
		},
		[{name : 'target'}],
		{}
	));



	twing.addFunction(createFunction(
		'get_type',
		(context, value) => {
			if( [null, undefined].includes(value) ) return Promise.resolve(`${value}`.toLowerCase());
			return Promise.resolve(Object.prototype.toString.call(value).slice(8, -1).toLowerCase());
		},
		[{name : 'value'}],
		{}
	));



	twing.addFunction(createFunction(
		'merge',
		function(context, base, ...extensions){
			extensions = [base]
				.concat(extensions.map(extension => Object.fromEntries(extension.entries())))
				.filter(extension => typeof extension === 'object')
			;
			return Promise.resolve(Object.assign({}, ...extensions));
		},
		[
			{name : 'base'},
			{name : 'extensions'},
		],
		{isVariadic : true}
	));



	twing.addFunction(createFunction(
		'style_modifier',
		function(context){
			const styleModifier = context.context.get('style_modifier');
			if( !!styleModifier ){
				return Promise.resolve(` ${styleModifier}`);
			} else {
				return Promise.resolve('');
			}
		},
		[],
		{}
	));



	twing.addFunction(createFunction(
		'content_image',
		(context, imageDefinitionOrDummyImageName) => {
			if( typeof imageDefinitionOrDummyImageName === 'string' ){
				return Promise.resolve({
					alt : imageDefinitionOrDummyImageName,
					sources : {
						small : `/img/dummy-images/${imageDefinitionOrDummyImageName}-small.png`,
						small2x : `/img/dummy-images/${imageDefinitionOrDummyImageName}-small@2x.png`,
						medium : `/img/dummy-images/${imageDefinitionOrDummyImageName}-medium.png`,
						medium2x : `/img/dummy-images/${imageDefinitionOrDummyImageName}-medium@2x.png`,
						large : `/img/dummy-images/${imageDefinitionOrDummyImageName}-large.png`,
						large2x : `/img/dummy-images/${imageDefinitionOrDummyImageName}-large@2x.png`,
					},
				});
			} else {
				return Promise.resolve(imageDefinitionOrDummyImageName);
			}
		},
		[{name : 'imageDefinitionOrDummyImageName'}],
		{}
	));



	twing.addFunction(createFunction(
		'pattern',
		(context, patternName, variables) => {
			const template = `@${patternName}.twig`;
			if( typeof variables !== 'object' ){
				variables = {_default_ : variables};
			}
			return Promise.resolve(twing.render(template, variables, false));
		},
		[
			{name : 'patternName'},
			{name : 'variables', defaultValue : {}},
		],
		{}
	));



	const PATTERN_TAG = 'pattern';
	twing.addTagHandler({
		tag : PATTERN_TAG,
		initialize(parser){
			return (token, stream) => {
				const
					{line, column} = token,
					parent = parser.parseExpression(stream),
					embedArguments = parseArguments(parser, stream, line, column),
					variables = embedArguments.variables,
					only = embedArguments.only,
					ignoreMissing = false
				;

				let	parentToken;
				if( parent.type === 'constant' ){
					parentToken = new Token(
						'STRING',
						`@${parent.attributes.value}.twig`,
						token.line,
						token.column
					);
				} else if( parent.type === 'name' ){
					parentToken = new Token(
						'NAME',
						parent.attributes.name,
						token.line,
						token.column
					);
				}

				stream.injectTokens([
					new Token('TAG_START', '', token.line, token.column),
					new Token('NAME', 'extends', token.line, token.column),
					parentToken,
					new Token('TAG_END', '', token.line, token.column),
				]);

				const module = parser.parse(stream, PATTERN_TAG, token => {
					return token.test('NAME', `end${PATTERN_TAG}`);
				});

				stream.next();

				if( !parentToken ){
					module.children.parent = parent;
				}

				parser.embedTemplate(module);

				stream.expect('TAG_END');

				return createEmbedNode(
					{
						index : module.attributes.index,
						only,
						ignoreMissing
					},
					{variables},
					token.line,
					token.column,
					PATTERN_TAG
				);
			};
		}
	});

}

module.exports = setupExtensions;
