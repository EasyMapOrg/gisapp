/**
 * FeatureInfo
 *
 * Send feature info requests and parse results
 * Implementation for QGIS Server XML query results
 */

function FeatureInfo(resultsCallback) {
  // resultsCallback(results)
  this.resultsCallback = resultsCallback;
}

// inherit from MapClickHandler
FeatureInfo.prototype = new MapClickHandler();

/**
 * make getfeature info request on provided location without user interaction
 *
 * location: array
 */
FeatureInfo.prototype.callOnLocation = function(location, useWMS, layers) {
    var url = null;
    if (useWMS) {
        var params = {
            'INFO_FORMAT': Config.featureInfo.format,
            'FEATURE_COUNT': Config.featureInfo.wmsMaxFeatures
        };
        if (Config.map.wmsServerType === 'qgis') {
            // add tolerances
            $.extend(params, {
                FI_POINT_TOLERANCE: Config.featureInfo.tolerances.point,
                FI_LINE_TOLERANCE: Config.featureInfo.tolerances.line,
                FI_POLYGON_TOLERANCE: Config.featureInfo.tolerances.polygon
            });
        }

        url = Map.getGetFeatureInfoUrl(location, params);
    }
    else {
        url = Config.featureInfo.url('common', location, layers);
    }
    $.ajax({
        url: url,
        dataType: 'text',
        context: this
    }).done(function(data, status) {
        var results = null;
        if (Config.featureInfo.format === 'text/xml') {
            results = this.parseResults([data]);
        }
        else {
            results = [data];
        }

        this.resultsCallback(results);
    });
};



/**
 * send feature info request on map click
 *
 * e: <ol.MapBrowserEvent>
 */
FeatureInfo.prototype.handleEvent = function(e) {
  var url = null;
  if (Config.featureInfo.useWMSGetFeatureInfo) {
    var params = {
      'INFO_FORMAT': Config.featureInfo.format,
      'FEATURE_COUNT': Config.featureInfo.wmsMaxFeatures
    };
    if (Config.map.wmsServerType === 'qgis') {
      // add tolerances
      $.extend(params, {
        FI_POINT_TOLERANCE: Math.round(Config.featureInfo.tolerances.point * e.frameState.pixelRatio),
        FI_LINE_TOLERANCE: Math.round(Config.featureInfo.tolerances.line * e.frameState.pixelRatio),
        FI_POLYGON_TOLERANCE: Math.round(Config.featureInfo.tolerances.polygon * e.frameState.pixelRatio)
      });
    }
    url = Map.getGetFeatureInfoUrl(e.coordinate, params);
  }
  else {
    url = Config.featureInfo.url(Map.topic, e.coordinate, Map.featureInfoLayers());
  }
  $.ajax({
    url: url,
    dataType: 'text',
    context: this
  }).done(function(data, status) {
    var results = null;
    if (Config.featureInfo.format === 'text/xml') {
      results = this.parseResults([data]);
    }
    else {
      results = [data];
    }

    this.resultsCallback(results);
  });
};

/**
 * parse contents of GetFeatureInfo results
 *
 * [
 *   {
 *     layer: <layername>,
 *     features: [
 *       {
 *         id: <feature id or null for rasters>,
 *         attributes: [
 *           name: <name>,
 *           value: <value>
 *         ]
 *       }
 *     ]
 *   }
 * ]
 */
FeatureInfo.prototype.parseResults = function(featureInfos) {
  var results = [];
  for (var i=0; i<featureInfos.length; i++) {
    var xml = $.parseXML(featureInfos[i]);
    $(xml).find('Layer').each(function() {
      var features = [];
      var lay = $(this).attr('name');
      if ($(this).find('Feature').length > 0) {
        // vector features
        $(this).find('Feature').each(function() {
          var attributes = [];
          $(this).find('Attribute').each(function() {
            // filter geometry
            if ($(this).attr('name') != 'geometry') {
              attributes.push({
                name: $(this).attr('name'),
                value: $(this).attr('value').replace("NULL", Eqwc.settings.noDataValue)
              });
            }
          });
          features.push({
            id: $(this).attr('id'),
            attributes: attributes
          });
        });
      }
      else if ($(this).find('Attribute').length > 0) {
        // raster layer
        var attributes = [];
        $(this).find('Attribute').each(function() {
          attributes.push({
            name: Eqwc.common.getRasterFieldName(Config.getLayerName(lay), $(this).attr('name')),
            value: $(this).attr('value').replace("NULL", Eqwc.settings.noDataValue)
          });
        });
        features.push({
          id: null,
          attributes: attributes
        });
      }

      if (features.length > 0) {
        results.push({
          layer: lay,
          features: features
        });
      }
    });
  }

  return results.reverse();
};
