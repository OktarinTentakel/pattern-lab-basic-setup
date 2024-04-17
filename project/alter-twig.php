<?php

use Twig\Environment;
use Twig\TwigFunction;
use Twig\Token;
use Twig\TokenParser\AbstractTokenParser;
use Twig\Extension\AbstractExtension;
use Twig\Node\Node;
use Twig\Compiler;
use Twig\Node\Expression\ArrayExpression;



function addCustomExtension(Environment &$env, $config) {

	// activate this to enable the debug extension, to use the {{ dump() }} function
	// $env->addExtension(new Twig\Extension\DebugExtension());



	$env->addFunction(new TwigFunction('style_modifier', function($context){
		if( isset($context['__style_modifier__']) ){
			return " {$context['__style_modifier__']}";
		} else {
			return '';
		}
	}, ['needs_context' => true]));



	$env->addFunction(new TwigFunction('content_image', function($imageDefinitionOrDummyImageName){
    		if( is_string($imageDefinitionOrDummyImageName) ){
    			return [
    				'alt' => $imageDefinitionOrDummyImageName,
    				'sources' => [
    					'small' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-small.png",
    					'small2x' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-small@2x.png",
    					'medium' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-medium.png",
    					'medium2x' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-medium@2x.png",
    					'large' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-large.png",
    					'large2x' => "/img/dummy-images/{$imageDefinitionOrDummyImageName}-large@2x.png",
    				]
    			];
    		} else {
    			return $imageDefinitionOrDummyImageName;
    		}
    	}));



	class PatternTagTokenParser extends AbstractTokenParser {
		public function parse(Token $token){
			$expr = $this->parser->getExpressionParser()->parseExpression();

			$stream = $this->parser->getStream();
			$args = new ArrayExpression([], $token->getLine());
			if ($stream->nextIf(Token::NAME_TYPE, 'with')) {
				$args = $this->parser->getExpressionParser()->parseExpression();
			}

			$only = false;
			if ($stream->nextIf(Token::NAME_TYPE, 'only')) {
				$only = true;
			}

			$stream->expect(Token::BLOCK_END_TYPE);

			return new PatternTagNode($expr, $args, $only, $token->getLine(), $this->getTag());
		}

		public function getTag(){
			return 'pattern';
		}
	}

	class PatternTagNode extends Node {
		public function __construct(Node $expr, Node $args, $only, $line, $tag = null){
			parent::__construct(['expr' => $expr, 'args' => $args], ['only' => $only], $line, $tag);
		}

		public function compile(Compiler $compiler){
			$templateName = $this->getNode('expr');
			$templateName->setAttribute('value', "@{$templateName->getAttribute('value')}.twig");

			$includeNode = new \Twig\Node\IncludeNode(
				$templateName,
				$this->getNode('args'),
				$this->getAttribute('only'),
				false,
				false,
				$this->getTemplateLine()
			);

			$compiler->subcompile($includeNode);
		}
	}

	class PatternTagExtension extends AbstractExtension {
		public function getTokenParsers(){
			return [new PatternTagTokenParser()];
		}
	}

	$env->addExtension(new PatternTagExtension());
}
