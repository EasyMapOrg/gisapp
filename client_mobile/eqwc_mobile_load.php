<?php

require_once("../admin/class.Helpers.php");
require_once("../admin/settings.php");

session_start();

$version = \GisApp\Helpers::getEqwcVersion();
$lang = [];
$plugins = [];
$eqwc_debug = [
   "client_common/common.js?v=".$version,
    "client_mobile/src/url_params.js?v=".$version,
    "client_mobile/src/permalink.js?v=".$version,
    "client_mobile/src/login.js?v=".$version,
    "client_mobile/src/search.js?v=".$version,
    "client_mobile/src/geocode.js?v=".$version,
    //NOTE: remove unused classes
    //"client_mobile/src/mapfish_permalink.js"
    "client_mobile/src/qgis_permalink.js?v=".$version,
    //"client_mobile/src/mapfish_login.js"
    //"client_mobile/src/mapfish_search.js"
    //"client_mobile/src/swiss_search.js"
    "client_mobile/src/wsgi_search.js?v=".$version,
    "client_mobile/src/config.js?v=".$version,
    "client_mobile/src/map.js?v=".$version,
    "client_mobile/src/map_click_handler.js?v=".$version,
    "client_mobile/src/feature_info.js?v=".$version,
    "client_mobile/src/topics.js?v=".$version,
    "client_mobile/src/layers.js?v=".$version,
    "client_mobile/src/gui.js?v=".$version
    //"client_mobile/src/high_resolution_printing.js"
    ];
$dir = dirname(dirname(__FILE__)) . "/plugins/";
$scan = array_slice(scandir($dir), 2);
$def_lang = $_SESSION['lang'];

//eqwc language files
array_push($lang, "admin/languages/". $def_lang .".js");

//add into array all js files in plugins/xxx/src_mobile subfolder
foreach ($scan as $item) {
    if (is_dir($dir . $item)) {
        $plugin_path = $dir . $item;

        //add plugin config.js if exists
        if (file_exists($plugin_path . "/js/config.js")) {
            array_push($plugins, "plugins/" . basename($plugin_path) . "/js/config.js?v=" . rand());
        }

        if (is_dir($plugin_path . '/src_mobile/')) {
            $js_arr = array_slice(scandir($plugin_path . '/src_mobile/'), 2);
            foreach ($js_arr as $script) {
                //only js files
                if (substr($script, -2) == 'js') {
                    array_push($plugins, "plugins/" . basename($plugin_path) . "/src_mobile/" . $script . "?v=" . rand());
                }
            }
        }
    }
}

Header("content-type: application/x-javascript");
?>

function getRandomNum() {
    return Math.floor((Math.random() * 100000) + 1);
}

(function () {

    var version = "<?php echo $version ?>";
    var jsFiles = [
        "client_common/customProjections.js?n="+getRandomNum(),
        "client_common/settings.js?n="+getRandomNum(),
        "<?php echo implode('","',$lang) ?>",
        "<?php echo implode('","',$eqwc_debug) ?>",
        "<?php echo implode('","',$plugins) ?>"
    ];

    // use "parser-inserted scripts" for guaranteed execution order
    var scriptTags = new Array(jsFiles.length);
    for (var i = 0, len = jsFiles.length; i < len; i++) {
        scriptTags[i] = "<script src='" + jsFiles[i] + "'></script>";
    }
    if (scriptTags.length > 0) {
        document.write(scriptTags.join(""));
    }
})();



