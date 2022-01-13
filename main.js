require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/FeatureTable",
  "esri/widgets/Search",
], function (Map, MapView, FeatureLayer, FeatureTable, Search) {
  let selectedFeature, id;
  let featureTable, featureLayer, template, map, view, searchBar;
  const features = [];
  let changeReq = `<=`;

  const url =
    "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties/FeatureServer/0/";

  template = {
    title: "Information",
    lastEditInfoEnable: false,
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "STATE_NAME",
            label: "State",
          },
          {
            fieldName: "NAME",
            label: "County",
          },
          { fieldName: "POPULATION", label: "Population" },
        ],
      },
    ],
  };
  featureLayer = new FeatureLayer({
    url: url,
    popupTemplate: template,
  });

  map = new Map({
    basemap: "dark-gray-vector",
    layers: [featureLayer],
  });

  view = new MapView({
    container: "viewDiv",
    map: map,

    extent: {
      xmin: -19942765.3260505,
      ymin: 2144424.27930457,
      xmax: -7452796.26268635,
      ymax: 11528300.5677573,
      spatialReference: 3857,
    },
  });
  setupCSV();
  searchBar = new Search({
    view: view,
  });

  view.ui.add(searchBar, {
    position: "top-right",
  });

  view.when(() => {
    featureTable = new FeatureTable({
      view: view,
      layer: featureLayer,
      fieldConfigs: [
        {
          name: "STATE_NAME",
          label: "State",
          direction: "asc",
        },
        {
          name: "NAME",
          label: "County",
        },

        {
          name: "POPULATION",
          label: "Population",
        },
      ],

      container: document.getElementById("tableDiv"),
    });

    view.ui.add(document.getElementById("mainDiv"), "bottom-right");
    const checkboxEle = document.getElementById("checkboxId");
    const labelText = document.getElementById("labelText");
    const tableContainer = document.getElementById("tableContainer");
    checkboxEle.onchange = () => {
      toggleFeatureTable();
    };

    function toggleFeatureTable() {
      if (!checkboxEle.checked) {
        appContainer.removeChild(tableContainer);
        labelText.innerHTML = "Show Feature Table";
      } else {
        appContainer.appendChild(tableContainer);
        labelText.innerHTML = "Hide Feature Table";
      }
    }
    featureTable.on("selection-change", (changes) => {
      changes.removed.forEach((item) => {
        const data = features.find((data) => {
          return data.feature === item.feature;
        });
      });

      changes.added.forEach((item) => {
        const feature = item.feature;
        features.push({
          feature: feature,
        });

        if (feature.attributes.OBJECTID !== id && view.popup.visible === true) {
          featureTable.deselectRows(selectedFeature);
          view.popup.close();
        }
      });
    });
  });

  let result = [];
  const btn = document.getElementById("btn-export");
  btn.addEventListener("click", () => {
    exportToCSV(ConvertToCSV(result));
  });

  async function setupCSV() {
    view.ui.add("btn-export", "top-left");
    let urlData = `${url}query?where=FID+${changeReq}+2000&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.1&units=esriSRUnit_Meter&returnGeodetic=false&outFields=fid%2C+state_name%2C+name%2C+population&returnGeometry=false&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=`;
    let res = await fetch(urlData);
    let data = await res.json();
    result.push(data);

    if (data.features.length == 2000) {
      changeReq = ">";
      setupCSV();
    }
  }

  function ConvertToCSV(objArray) {
    let array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
    let str = "STATE_NAME, NAME, POPULATION \r\n";

    array.forEach((obj) => {
      for (let i = 0; i < obj.features.length; i++) {
        let line = "";
        for (let index in obj.features[i].attributes) {
          if (index === "FID") {
            continue;
          }
          if (line != "") {
            line += ",";
          }
          line += obj.features[i].attributes[index];
        }
        str += line + "\r\n";
      }
    });
    return str;
  }

  function exportToCSV(csv) {
    if (!csv.match(/^data:text\/csv/i)) {
      csv = "data:text/csv;charset=utf-8," + csv;
    }
    let encodedUri = encodeURI(csv);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Exportdata.csv");
    link.click();
  }
});
