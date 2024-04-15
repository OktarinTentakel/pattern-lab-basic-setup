const
	NAME = 'molecule-field',
	SELECTOR = `.${NAME}`
;



class MoleculeField {

	constructor(app, element){
console.log(NAME, app, element, __ENVIRONMENT__);
	}

}



export function init(app){
	Array.from(document.querySelectorAll(SELECTOR)).forEach(element => {
		new MoleculeField(app, element);
	});
}
