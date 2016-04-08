// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initStreetViewInspect(controller, panorama, $panorama, $overlayContainer) {

    var dom = {
        treeProperties: '#tree-properties',
    };

    $(dom.treeProperties)
        .css( "display", "inline-block")
        .hide();

    initEventHandlers();

    return {
        name: 'inspect',
        enable: enableMode,
        disable: disableMode,
        onClick: onClick
    };

    function enableMode() {
        panorama.setOptions({linksControl: false});
        $(dom.treeProperties).show();
        var tree = controller.getState().currentTree;
        loadData(tree);
    }

    function disableMode() {
        $(dom.treeProperties).hide();
    }

    function onClick(currentModeName) {
        if (currentModeName === 'measure') {
            return true;
        } else {
            alert("Please click a tree on the map to edit its properties.");
            return false;  // don't enable mode
        }
    }

    function initEventHandlers() {
        initHandler('genus');
        initHandler('condition');
        initHandler('diameter');

        function initHandler(name) {
            var $field = getDomField(name);
            $field.on('change', onDataChanged);
        }
    }

    function loadData(tree) {
        loadField('genus');
        loadField('condition');
        loadField('diameter');

        function loadField(name) {
            var $field = getDomField(name),
                value = tree && tree[name] ? tree[name] : "";
            if (isNumeric(value)) {
                value = value.toFixed(1);
            }
            $field.val(value);
        }
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function onDataChanged(e) {
        var $field = $(e.target),
            fieldName = $field.data('field-name'),
            tree = controller.getState().currentTree;
        tree[fieldName] = $field.val();
    }

    function getDomField(name) {
        return $('[data-field-name=' + name + ']');
    }
}