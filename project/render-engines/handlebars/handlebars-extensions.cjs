module.exports = function(handlebars){

	handlebars.registerHelper('with_content_image', function(image, options){
		if(typeof image === 'string' ){
			const dummyImage = {
				alt : `${image} Dummy Image Alt Text`,
				sources : {
					mobile : `/img/dummy-images/${image}-mobile.png`,
					mobile2x : `/img/dummy-images/${image}-mobile@2x.png`,
					tablet : `/img/dummy-images/${image}-tablet.png`,
					tablet2x : `/img/dummy-images/${image}-tablet@2x.png`,
					desktop : `/img/dummy-images/${image}-desktop.png`,
					desktop2x : `/img/dummy-images/${image}-desktop@2x.png`
				}
			};

			return options.fn(dummyImage, {
				data: options.data,
				blockParams: [dummyImage]
			});
		} else {
			return options.fn(image, {
				data: options.data,
				blockParams: [image]
			});
		}
	});



	handlebars.registerHelper('style_modifier', function(){
		const styleModifier = this.styleModifier || this.style_modifier;

		return styleModifier ? ` ${styleModifier}` : '';
	});



	handlebars.registerHelper('to_string', function(name){
		return `${name}`;
	});



	handlebars.registerHelper('assign', function(name, value){
		if( value ){
			this[`${name}`] = value;
		}
	});



	handlebars.registerHelper('range', function(from, to){
		let res = [];

		for(let i = parseInt(from, 10); i <= parseInt(to, 10); i++){
			res.push(i);
		}

		return res;
	});



	return handlebars;

};
