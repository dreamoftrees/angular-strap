/**
 * angular-strap
 * @version v2.1.2 - 2014-10-20
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes (olivier@mg-crea.com)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';

angular.module('mgcrea.ngStrap.popover', ['mgcrea.ngStrap.tooltip'])

  .provider('$popover', function() {

    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      container: false,
      target: false,
      placement: 'right',
      template: 'popover/popover.tpl.html',
      contentTemplate: false,
      trigger: 'click',
      keyboard: true,
      html: false,
      title: '',
      content: '',
      delay: 0,
      autoClose: true
    };

    this.$get = ["$tooltip", function($tooltip) {

      function PopoverFactory(element, config) {

        // Common vars
        var options = angular.extend({}, defaults, config);

        var $popover = $tooltip(element, options);

        // Support scope as string options [/*title, */content]
        if(options.content) {
          $popover.$scope.content = options.content;
        }

        return $popover;

      }

      return PopoverFactory;

    }];

  })

  .directive('bsPopover', ['$document', '$window', '$sce', '$popover', function($document, $window, $sce, $popover) {

    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;

    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr) {

        // Directive options
        var options = {scope: scope};
        angular.forEach(['template', 'contentTemplate', 'placement', 'container', 'target', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'customClass', 'autoClose'], function(key) {
          if(angular.isDefined(attr[key])) options[key] = attr[key];
        });

        // Support scope as data-attrs
        angular.forEach(['title', 'content'], function(key) {
          attr[key] && attr.$observe(key, function(newValue, oldValue) {
            scope[key] = $sce.trustAsHtml(newValue);
            angular.isDefined(oldValue) && requestAnimationFrame(function() {
              popover && popover.$applyPlacement();
            });
          });
        });

        // Support scope as an object
        attr.bsPopover && scope.$watch(attr.bsPopover, function(newValue, oldValue) {
          if(angular.isObject(newValue)) {
            angular.extend(scope, newValue);
          } else {
            scope.content = newValue;
          }
          angular.isDefined(oldValue) && requestAnimationFrame(function() {
            popover && popover.$applyPlacement();
          });
        }, true);

        // Visibility binding support
        attr.bsShow && scope.$watch(attr.bsShow, function(newValue, oldValue) {
          if(!popover || !angular.isDefined(newValue)) return;
          if(angular.isString(newValue)) newValue = !!newValue.match(/true|,?(popover),?/i);
          newValue === true ? popover.show() : popover.hide();
        });

        // Initialize popover
        var popover = $popover(element, options);

        if(options.autoClose) {
            angular.element($document.body).bind('click', function (e) {

                // Find all elements with the popover attribute
                var popups = document.querySelectorAll('*[bs-popover]');
                if(popups) {
                    for(var i=0; i<popups.length; i++) {
                        var popup = popups[i];
                        var popupElement = angular.element(popup);

                        var content;
                        var arrow;
                        if(popupElement.next()) {
                            content = popupElement.next()[0].querySelector('.popover-content');
                            arrow = popupElement.next()[0].querySelector('.arrow');
                        }
                        //If the following condition is met, then the click does not correspond
                        //to a click on the current popover in the loop or its content.
                        //So, we can safely remove the current popover's content and set the scope property of the popover
                        if(popup != e.target && e.target != content && e.target != arrow) {
                            if(popupElement.next().hasClass('popover')) {
                                //Remove the popover content
                                popupElement.next().remove();
                                //Set the scope to reflect this
                                popupElement.attr('bs-show', false);
                            }
                        }
                    }
                }
            });
        }

        // Garbage collection
        scope.$on('$destroy', function() {

          if(options.autoClose) angular.element($document.body).unbind('click');
          if (popover) popover.destroy();
          options = null;
          popover = null;
        });

      }
    };

  }]);
