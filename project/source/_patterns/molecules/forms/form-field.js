/*
 * ~ATOM MOLECULE FORM FIELD~
 */

//###[ IMPORTS ]########################################################################################################

import {AbstractPattern} from 'pattern-lab/abstract-pattern';



//###[ CONSTANTS ]######################################################################################################

const
	NAME = 'molecule-form-field',
	SELECTOR = `.${NAME}`
;



//###[ CLASS ]##########################################################################################################

class MoleculeFormField extends AbstractPattern {

	constructor(app, element){
		super(app, element);
		// this._app
		// this._element
	}

}



//###[ SETUP ]##########################################################################################################

export function init(app){
	Array.from(document.querySelectorAll(SELECTOR)).forEach(element => {
		new MoleculeFormField(app, element);
	});
}
