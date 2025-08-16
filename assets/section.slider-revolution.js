(function($){

    'use strict';

    class SliderRevolution extends HTMLElement {
        constructor() {
            super();
            
            setTimeout(() => {
                theme.AssetsLoader.onScrollOrUserAction(this, () => {
                    this.load();
                });
            }, 0);
        }

        load() {
            this.$container = $(this);

            try {
				this.revapi = page.RevolutionInit();
			} catch(e) {
				console.log('JavaScript Error', e);
			}
        }

        disconnectedCallback() {
            if(this.revapi) {
				this.revapi.revkill();
			}
        }
    }

    theme.AssetsLoader.onPageLoaded(function() {
        customElements.define('slider-revolution', SliderRevolution);
    });
})(jQueryTheme);