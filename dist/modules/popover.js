/**
 * angular-strap
 * @version v2.1.3 - 2014-11-18
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

        // Bind the click to remove
        if(options.autoClose) {
          scope.$on('tooltip.show', function($tooltip) {

              angular.element($document[0].body).bind('click', function (e) {

                  // Dont close all popups just close this one..
                  //var popups = $document.querySelectorAll('*[bs-popover]');
                  var popups = [element];
                  if(popups) {
                      for(var i=0; i<popups.length; i++) {
                          var popup = popups[i];
                          var popupElement = angular.element(popup);
                          var popupContainer = popupElement.next();
                          if(popupContainer.length && popupContainer.hasClass('popover')) {

                              var isInside = false;
                              if(popupContainer == e.target) {

                                  // Clicking on the popup
                                  isInside = true;
                              } else {

                                  // Test to see if inside
                                  var popupContents = popupContainer.find('*');
                                  var popupContent;
                                  if (popupContents.length > 0) {
                                      for (var i = 0, m = popupContents.length; i < m; i++) {
                                          popupContent = popupContents[i];
                                          if (popupContent == e.target) {
                                              isInside = true;
                                              break;
                                          }
                                      }
                                  }
                              }

                              if(!isInside) {
                                  popupElement.scope().$hide();
                              }
                          }
                      }
                  }
              });
          });

          scope.$on('tooltip.hide.before', function($tooltip) {
              if(options.autoClose) angular.element($document[0].body).unbind('click');
          });
        }

        scope.$hide = function() {
          popover.hide();
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
