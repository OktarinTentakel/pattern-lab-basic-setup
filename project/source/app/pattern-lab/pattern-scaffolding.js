//###[ CONSTANTS ]######################################################################################################

const
	SECTION_CLASS = 'organism-section',
	SECTION_WRAP = '<div class="organism-section"><div class="content"></div></div>',
	SECTION_HEADLINE = '<div class="headline-holder"><h2 class="atom-secondary-headline headline"></h2></div>',
	GRID_CONTAINER_CLASS = 'sg-grid-container',
	GRID_CONTAINER_WRAP = '<div class="sg-grid-container"><div class="content"></div></div>',
	MODULE_INTRO_CLASS = 'molecule-module-intro',
	CONTAINER_BACKGROUND_TYPES = ['negative']
;



//###[ PATTERN LAB SCAFFOLDER ]#########################################################################################

class PatternLabScaffolderSingleton {

	constructor(fPatternInit){
		fPatternInit.apply(this);

		// since we applied sections, we need to mock a resize, so things like object-fit polyfills reevaluate
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				window.dispatchEvent(new Event('resize'));
			});
		});
	}



	/*
	 * Automatically wraps a pattern in a section for display in pattern lists and
	 * single view outside of templates without polluting every template with a section wrapping the pattern.
	 *
	 * @param {String} htmlIdStart - the start of the pattern's html id in a pattern list, without the pseudo part e.g. "atoms-foobar"
	 * @param {String} cssClass - the identifying css class for a pattern in single view, the class of the pattern itself so to speak
	 * @param {Bool|String} [headline=false] - define if a headline should be included if not a boolean, string representation will be used as custom headline
	 * @param {Bool} [addHeadlineIfIntro=false] - normally we do not want to show section headline/intro together with module intro, if you want this, set this to true
	 */
	buildSectionFor(htmlIdStart, cssClass, headline=false, addHeadlineIfIntro=false){
		const eHeadline = !!headline
			? (new DOMParser())
				.parseFromString(SECTION_HEADLINE, 'text/html')
				.querySelector('.headline-holder')
			: null
		;

		if( !!eHeadline ){
			eHeadline.querySelector('.headline').textContent = (headline !== true)
				? `${headline}`
				: 'Section Headline'
			;
		}

		// for display in list of patterns
		document.querySelectorAll(`[id^="${htmlIdStart}"].pl-c-pattern`).forEach(eListPattern => {
			if( eListPattern.querySelector(`.${SECTION_CLASS}`) === null ){
				const ePattern = eListPattern.querySelector(`.pl-js-pattern-example > .${cssClass}`);

				if( ePattern !== null ){
					const
						eExample = ePattern.parentNode,
						eSection = (new DOMParser())
							.parseFromString(SECTION_WRAP, 'text/html')
							.querySelector(`.${SECTION_CLASS}`)
						,
						hasIntro = eListPattern.querySelector(`.${MODULE_INTRO_CLASS}`)
					;

					eExample.prepend(eSection);
					eSection.querySelector('.content').append(ePattern);

					if( !!eHeadline && (!hasIntro || addHeadlineIfIntro) ){
						eSection.prepend(eHeadline.cloneNode(true));
					}
				}
			}
		});

		// for single display
		document.querySelectorAll(`html.is__in-pattern-lab-details > body > .${cssClass}`).forEach(eDetailPattern => {
			const
				eSection = (new DOMParser())
					.parseFromString(SECTION_WRAP, 'text/html')
					.querySelector(`.${SECTION_CLASS}`)
				,
				hasIntro = eDetailPattern.querySelector(`.${MODULE_INTRO_CLASS}`)
			;

			eDetailPattern.parentNode.insertBefore(eSection, eDetailPattern);
			eSection.querySelector('.content').append(eDetailPattern);

			if( !!eHeadline && (!hasIntro || addHeadlineIfIntro) ){
				eSection.prepend(eHeadline.cloneNode(true));
			}

			this.#addPatternInfoToBody(htmlIdStart);
		});
	}



	/*
	 * Automatically wraps a pattern in a grid container for better display in pattern lists and
	 * single view outside of templates. This functionality allows pattern-scaffolding.scss to individually
	 * adapt single patterns outside of organisms or templates to display in a usable fashion even if the
	 * pattern itself always fills its containing element for example.
	 *
	 * @param {String} htmlIdStart - the start of the pattern's html id in a pattern list, without the pseudo part e.g. "atoms-foobar"
	 * @param {String} cssClass - the identifying css class for a pattern in single view, the class of the pattern itself so to speak
	 * @param {Boolean} [bgType=null] - define if the container should have a visible background; types currently are: 'negative'
	 */
	buildGridContainerFor(htmlIdStart, cssClass, bgType=null){
		bgType = !!bgType ? `${bgType}` : null;

		// for display in list of patterns
		document.querySelectorAll(`[id^="${htmlIdStart}"].pl-c-pattern`).forEach(eListPattern => {
			if( eListPattern.querySelector(`.${GRID_CONTAINER_CLASS}`) === null ){
				const ePattern = eListPattern.querySelector(`.pl-js-pattern-example > .${cssClass}`);

				if( ePattern !== null ){
					const
						eExample = ePattern.parentNode,
						eContainer = (new DOMParser())
							.parseFromString(GRID_CONTAINER_WRAP, 'text/html')
							.querySelector(`.${GRID_CONTAINER_CLASS}`)
					;

					eExample.prepend(eContainer);
					eContainer.querySelector('.content').append(ePattern);

					if( !!bgType && (CONTAINER_BACKGROUND_TYPES.indexOf(`${bgType}`) >= 0) ){
						eContainer.classList.add(`has__${bgType}-background`);
					}
				}
			}
		});

		// for single display
		document.querySelectorAll(`html.is__in-pattern-lab-details > body > .${cssClass}`).forEach(eDetailPattern => {
			const eContainer = (new DOMParser())
				.parseFromString(GRID_CONTAINER_WRAP, 'text/html')
				.querySelector(`.${GRID_CONTAINER_CLASS}`)
			;

			eDetailPattern.parentNode.insertBefore(eContainer, eDetailPattern);
			eContainer.querySelector('.content').append(eDetailPattern);

			if( bgType && (CONTAINER_BACKGROUND_TYPES.indexOf(`${bgType}`) >= 0) ){
				eContainer.classList.add(`has__${bgType}-background`);
			}

			this.#addPatternInfoToBody(htmlIdStart);
		});
	}



	/*
	 * Just adds pattern info to the body/document, to make the pattern targetable by pattern scaffolding.
	 * Use this if you do not need a section or a grid container, but just want to target the pattern itself.
	 *
	 * @param {String} htmlIdStart - the start of the pattern's html id in a pattern list, without the pseudo part e.g. "atoms-foobar"
	 * @param {String} cssClass - the identifying css class for a pattern in single view, the class of the pattern itself so to speak
	 */
	justAddPatternInfo(htmlIdStart, cssClass){
		document.querySelectorAll(`html.is__in-pattern-lab-details > body > .${cssClass}`).forEach(() => {
			this.#addPatternInfoToBody(htmlIdStart);
		});
	}



	#addPatternInfoToBody(basePatternId){
		const eBody = document.querySelector('body');
		eBody.id = basePatternId;

		const
			searchParams = new URL(window.parent.location.href).searchParams,
			patternVariant = searchParams.get('p')
		;

		if( patternVariant !== null ){
			eBody.setAttribute('data-pattern-variant', patternVariant);
		}
	}

}



//###[ INIT ]###########################################################################################################

export const PatternLabScaffolder = new PatternLabScaffolderSingleton(function(){
	this.justAddPatternInfo('atoms-text-input', 'atom-text-input');

	this.buildGridContainerFor('molecules-field', 'molecule-field:not(.negative)');
	this.buildGridContainerFor('molecules-field', 'molecule-field.negative', 'negative');

	this.buildSectionFor('organisms-form', 'organism-form', 'Form Section', true);
});
