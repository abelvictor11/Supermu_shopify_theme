(function($){

    'use strict';

    class CarouselProducts extends HTMLElement {
        constructor() {
            super();

            this.settings = {
                arrows: true
            };

            this.isLoaded = false;
            this.intersectionObserver = null;
            this.resizeNamespace = '';
            this.reducedMotionQuery = null;
            this.handleReducedMotionChange = null;
            this.xhr = null;
            this.$scrollbar = null;
            this.$scrollbarDrag = null;
            this.handleScrollbarClick = null;
        }

        connectedCallback() {
            if('IntersectionObserver' in window) {
                this.intersectionObserver = new IntersectionObserver((entries) => {
                    if(entries.some((entry) => entry.isIntersecting)) {
                        this.intersectionObserver.disconnect();
                        this.load();
                    }
                }, {
                    rootMargin: '600px 0px'
                });

                this.intersectionObserver.observe(this);
            } else {
                this.load();
            }
        }

        load() {
            if(this.isLoaded) return;

            this.isLoaded = true;
            if(this.intersectionObserver) {
                this.intersectionObserver.disconnect();
            }

            this.$container = $(this);

            var _ = this,
                $recommendations = this.$container.find('.product-recommendations'),
                product_id,
                limit;

            theme.AssetsLoader.loadManually([
                ['styles', 'plugin_slick'],
                ['scripts', 'plugin_slick']
            ],
            function() {
                if(!_.isConnected) return;

                if($recommendations.length) {
                    product_id = $recommendations.attr('data-product-id');
                    limit = $recommendations.attr('data-limit');

                    _.xhr = $.ajax({
                        type: 'GET',
                        url: theme.routes.root_url + 'recommendations/products',
                        data: {
                            section_id: $recommendations.parents('[data-section-id]').attr('data-section-id'),
                            product_id: product_id,
                            limit: limit
                        },
                        success: function (data) {
                            if(!_.isConnected) return;

                            data = data.replace(/<carousel-products/g, '<div').replace(/<\/carousel-products/g, '<\/div');
                            
                            $recommendations.html($(data).find('.product-recommendations').html());

                            _.initCarousel();

                            theme.LazyImage.update();
                            if(theme.MultiCurrency) {
                                theme.MultiCurrency.update();
                            }
                            if (theme.Tooltip) {
                                theme.Tooltip.init();
                            }
                        },
                        complete: function() {
                            _.xhr = null;
                        }
                    });
                } else {
                    _.initCarousel();
                }
            });
        }

        initCarousel() {
            var _ = this;

            this.$slick = this.$container.find('[data-js-carousel-slick]');
            this.resizeNamespace = '.carousel-products-' + this.$container.attr('data-section-id');

            if(this.$slick.length) {
                this.$slider = this.$container.find('[data-js-carousel]');
                this.$collections_ajax = this.$container.find('[data-carousel-ajax] [data-collection]');
                this.$products = this.$container.find('[data-carousel-items]');
                this.$slides = this.$slick.find('> *');
                this.$prev = this.$slider.find('[data-js-carousel-prev]');
                this.$next = this.$slider.find('[data-js-carousel-next]');
                this.$arrows = this.$slider.find('[data-js-carousel-arrow]');
                this.$control = this.$container.find('[data-carousel-control]');

                this.settings.arrows = this.$slider.attr('data-arrows') === 'true' ? true : false;
                this.settings.bullets = this.$slider.attr('data-bullets') === 'true' ? true : false;
                this.settings.count = +this.$slider.attr('data-count');
                this.settings.infinite = this.$slider.attr('data-infinite') === 'true' ? true : false;
                this.settings.autoplay = this.$slider.attr('data-autoplay') === 'true' ? true : false;
                this.settings.speed = +this.$slider.attr('data-speed') || 0;

                if(this.settings.arrows) {
                    $window.on('theme.resize' + this.resizeNamespace, function() {
                        _.arrowsPosition();
                    });
                }

                if(this.$collections_ajax.length) {
                    this.loadProducts(this.$collections_ajax.first());
                } else {
                    this.initSlick();
                }

                this.$control.on('click', 'a', function (e) {
                    var $this = $(this);

                    if(!$this.hasClass('active')) {
                        _.loadProducts($this, true);
                    }

                    e.preventDefault();
                    return false;
                });
            }
        }

        arrowsPosition() {
            var max_height = 0;

            this.$slick.find('.carousel__item img').each(function () {
                max_height = Math.max(max_height, $(this).innerHeight());
            });

            this.$arrows.css({top: max_height / 2});
            this.$prev.add(this.$next).css({'max-height': max_height});
        }

        initSlick() {
            var _ = this,
                prefersReducedMotion = false;

            this.removeReducedMotionListener();

            if(window.matchMedia) {
                this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
                prefersReducedMotion = this.reducedMotionQuery.matches;
                this.handleReducedMotionChange = function(event) {
                    if(!_.$slick || !_.$slick.hasClass('slick-initialized')) return;

                    if(event.matches) {
                        _.$slick.slick('slickPause');
                    } else if(_.settings.autoplay) {
                        _.$slick.slick('slickPlay');
                    }
                };

                if(this.reducedMotionQuery.addEventListener) {
                    this.reducedMotionQuery.addEventListener('change', this.handleReducedMotionChange);
                } else if(this.reducedMotionQuery.addListener) {
                    this.reducedMotionQuery.addListener(this.handleReducedMotionChange);
                }
            }

            this.$slick.one('init', function() {
                if(_.settings.arrows) {
                    _.arrowsPosition();
                }

                $window.trigger('checkImages');

                _.$slider.removeClass('invisible');

                theme.Preloader.unset(_.$slider.parent());
            });

            this.$slick.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                var check_before = nextSlide - 1,
                    check_after = nextSlide + _.settings.count;

                // Ocultar skeletons en las slides visibles
                var visibleSlides = _.$slick.find('.slick-slide.slick-active');
                visibleSlides.each(function() {
                    var $slide = $(this);
                    // Ocultar todos los tipos de skeletons
                    $slide.find('.product-skeleton-image, .product-collection-skeleton').hide();
                    $slide.find('.product__media').css('visibility', 'visible');
                });

                // Asegurarse de que las imágenes estén visibles
                _.$slick.find('.product-collection__media').css('visibility', 'visible');

                _._checkProduct(_.$slick.find('[data-slick-index="' + check_before + '"]'));

                for(var i = check_after; i > currentSlide + 1; i--) {
                    _._checkProduct(_.$slick.find('[data-slick-index="' + i + '"]'));
                }
            });

            this.$slick.on('afterChange', function () {
                if(theme.Tooltip) {
                    theme.Tooltip.init();
                }
            });

            this.$slick.one('init', function () {
               _.$slider.addClass('initialized');
            });

            this.initScrollbar();

            // Use data-count if specified and less than defaults (for half-width carousels)
            var maxSlides = this.settings.count && this.settings.count < 8 ? this.settings.count : 8;
            var defaultSlides = {
                xl: Math.min(5, maxSlides),
                lg: Math.min(4, maxSlides),
                md: Math.min(3, maxSlides),
                sm: Math.min(2, maxSlides),
                xs: Math.min(1, maxSlides)
            };
            
            this.$slick.slick({
                lazyLoad: false,
                arrows: this.settings.arrows,
                prevArrow: this.$prev,
                nextArrow: this.$next,
                dots: this.settings.bullets,
                dotsClass: 'slick-dots d-flex flex-wrap flex-center list-unstyled pt-7',
                adaptiveHeight: false,
                autoplay: this.settings.autoplay && !prefersReducedMotion,
                autoplaySpeed: this.settings.speed,
                infinite: this.settings.infinite,
                slidesToShow: maxSlides,
                slidesToScroll: 1,
                touchMove: true,
                swipeToSlide: true,
                rtl: theme.rtl,
                responsive: [
                    {
                        breakpoint: 1920, // Full HD+
                        settings: {
                            slidesToShow: defaultSlides.xl,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 1280, // xl screens
                        settings: {
                            slidesToShow: defaultSlides.lg,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 1024, // lg screens
                        settings: {
                            slidesToShow: defaultSlides.lg,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 768, // md screens
                        settings: {
                            slidesToShow: defaultSlides.md,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 640, // sm screens
                        settings: {
                            slidesToShow: defaultSlides.sm,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 480, // xs screens
                        settings: {
                            slidesToShow: defaultSlides.xs,
                            slidesToScroll: 1,
                            arrows: false,
                            dots: true
                        }
                    }
                ]
            });
        }

        initScrollbar() {
            var _ = this;

            this.destroyScrollbar();
            this.$scrollbar = this.$container.find('[data-carousel-scrollbar]');
            this.$scrollbarDrag = this.$container.find('[data-carousel-scrollbar-drag]');

            if(!this.$scrollbar.length || !this.$scrollbarDrag.length) return;

            this.$slick.on('init.homepageScrollbar setPosition.homepageScrollbar afterChange.homepageScrollbar', function(event, slick, currentSlide) {
                window.requestAnimationFrame(function() {
                    _.updateScrollbar(slick, currentSlide);
                });
            });

            this.$slick.on('beforeChange.homepageScrollbar', function(event, slick, currentSlide, nextSlide) {
                _.updateScrollbar(slick, nextSlide);
            });

            this.handleScrollbarClick = function(event) {
                if(!_.$slick.hasClass('slick-initialized')) return;

                var slick = _.$slick.slick('getSlick'),
                    rect = _.$scrollbar[0].getBoundingClientRect(),
                    ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
                    maxSlide = Math.max(0, slick.slideCount - slick.options.slidesToShow);

                _.$slick.slick('slickGoTo', Math.round(ratio * maxSlide));
            };

            this.$scrollbar[0].addEventListener('click', this.handleScrollbarClick);
        }

        updateScrollbar(slick, currentSlide) {
            if(!slick || !this.$scrollbarDrag || !this.$scrollbarDrag.length) return;

            var slideCount = slick.slideCount,
                slidesToShow = slick.options.slidesToShow,
                maxSlide = Math.max(0, slideCount - slidesToShow),
                activeSlide = Math.min(Math.max(currentSlide || 0, 0), maxSlide),
                dragWidth = slideCount > 0 ? Math.min(100, (slidesToShow / slideCount) * 100) : 100,
                dragLeft = maxSlide > 0 ? (activeSlide / maxSlide) * (100 - dragWidth) : 0;

            this.$scrollbarDrag.css({
                width: dragWidth + '%',
                left: dragLeft + '%'
            });
        }

        destroyScrollbar() {
            if(this.$slick) {
                this.$slick.off('.homepageScrollbar');
            }

            if(this.$scrollbar && this.$scrollbar.length && this.handleScrollbarClick) {
                this.$scrollbar[0].removeEventListener('click', this.handleScrollbarClick);
            }

            this.$scrollbar = null;
            this.$scrollbarDrag = null;
            this.handleScrollbarClick = null;
        }

        removeReducedMotionListener() {
            if(!this.reducedMotionQuery || !this.handleReducedMotionChange) return;

            if(this.reducedMotionQuery.removeEventListener) {
                this.reducedMotionQuery.removeEventListener('change', this.handleReducedMotionChange);
            } else if(this.reducedMotionQuery.removeListener) {
                this.reducedMotionQuery.removeListener(this.handleReducedMotionChange);
            }

            this.reducedMotionQuery = null;
            this.handleReducedMotionChange = null;
        }

        loadProducts($button, loader) {
            if(this.xhr) {
                this.xhr.abort();
            }

            var _ = this;

            if(loader) {
                theme.Preloader.set(this.$slider.parent());

                this.$slider.css({
                    'min-height': this.$slider.innerHeight()
                });
            }

            var collection = $button.attr('data-collection');

            this.xhr = $.ajax({
                type: 'GET',
                url: theme.routes.root_url + 'collections/' + collection,
                cache: false,
                data: {
                    view: 'carousel',
                    max_count: this.$products.attr('data-max-count'),
                    size_of_columns: this.$products.attr('data-products-pre-row'),
                    async_ajax_loading: this.$products.attr('data-async-ajax-loading')
                },
                dataType: 'html',
                success: function (data) {
                    if(!_.isConnected) return;

                    _.$slider.addClass('invisible');

                    if(_.$slick.hasClass('slick-initialized')) {
                        _.$slick.slick('destroy').off();
                    }

                    _.$slick.one('init', function () {
                        _.$slider.removeAttr('style');

                        if(loader) {
                            theme.Preloader.unset(_.$slider.parent());
                        }
                    });

                    _.$products.html(data);

                    _.$slides = _.$slick.find('> *');

                    _.initSlick();

                    theme.LazyImage.update();
                    if(theme.MultiCurrency) {
                        theme.MultiCurrency.update();
                    }
                    if(theme.Tooltip) {
                        theme.Tooltip.init();
                    }

                    _.$control.find('a').removeClass('active');
                    $button.addClass('active');

                    _.xhr = null;
                }
            });
        }

        _checkProduct($slide, beforeAjax) {
            var _ = this,
                handle = $slide.attr('data-handle');

            if(handle) {
                if(beforeAjax) {
                    beforeAjax($slide);
                }

                $.ajax({
                    type: 'GET',
                    url: theme.routes.root_url + 'products/' + handle,
                    data: {
                        view: 'collection'
                    },
                    cache: false,
                    dataType: 'html',
                    success: function (data) {
                        var $data = $(data);

                        $slide.add(_.$slick.find('.slick-cloned[data-handle="' + handle + '"]')).html($data).removeAttr('data-handle');
                        theme.LazyImage.update();
                        $slide.trigger('loaded');
                    }
                });

                return true;
            } else {
                return false;
            }
        }

        disconnectedCallback() {
            if(this.intersectionObserver) {
                this.intersectionObserver.disconnect();
                this.intersectionObserver = null;
            }

            if(this.xhr) {
                this.xhr.abort();
                this.xhr = null;
            }

            if(this.$slick) {
                this.destroyScrollbar();

                if(this.$slick.hasClass('slick-initialized')) {
                    this.$slick.slick('destroy');
                }
                this.$slick.off();
                this.$slick = null;
            }

            if(this.resizeNamespace) {
                $window.off('theme.resize' + this.resizeNamespace);
            }

            this.removeReducedMotionListener();

            if(this.$control) {
                this.$control.off();
            }
        }
    }

    theme.AssetsLoader.onPageLoaded(function() {
        customElements.define('carousel-products', CarouselProducts);
    });
})(jQueryTheme);







