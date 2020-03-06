/* Visualización interactiva de las Estadísticas de compra-venta de productos
   de Mercatenerife.
   Semidán Robaina Estévez, 2020
*/

Object.defineProperty(String.prototype, "capitalize", {
	value: function() {
		return this.slice(0, 1).toUpperCase() + this.slice(1, this.length).toLowerCase()
	}
});

if (window.matchMedia("(orientation: portrait)").matches) {
   alert("Please use Landscape!");
}

let backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--backgroundColor");
let fontColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--fontColor");

let plotOptions = {
  "plot_mean": false,
  "plot_local": true,
  "plot_importacion": true
};

const local_color = "rgb(9, 133, 208)";
const impor_color = "rgb(221, 125, 6)";
const moda_color = "rgb(167, 167, 167)";
const default_product_code = 21206;

let sum = function(array) {
  return array.reduce((a, b) => a + b, 0);
}
let mean = function(array) {
  return sum(array) / array.length
}
let std = function(array) {
  let mean_x = mean(array);
  let variance_x = mean(array.map(x => (x - mean_x)**2));
  let std_x = Math.sqrt(variance_x);
  return std_x
}

function getUniqueValues(array) {
  const unique = (value, index, self) => {
    return self.indexOf(value) === index
  };
  return array.filter(unique)
}

function initializeForm(products) {
  let form = 	document.getElementById("select-list");
  for (let product of Object.values(products).sort()) {
    let code = getKeyByValue(products, product);
    let option = document.createElement("option");
    option.text = product;
    option.value = code;
    option.setAttribute("id", code);
    if (parseInt(code) === 21206) {
      option.selected = "selected";
    }
    form.add(option);
  }
  plotSelectedProduct();
}

function deployPictureGrid(products, type="frutas") {
  let grid = document.getElementById("grid_container-" + type);
	let product_codes = product_classification[type];
  for (let code of product_codes) {
    let photo_name = Object.keys(
      product_pics).includes(String(code))? product_pics[code]: "no_photo.jpg";
    let grid_item = document.createElement("div");
    grid_item.setAttribute("class", "grid_item");
		grid_item.setAttribute("id", code);
    grid_item.setAttribute("tabindex", "0");
		grid_item.style["background-image"] = `url(https://semidanrobaina.com/mercaTenerife/Resized_Photos/${photo_name})`;
		let grid_item_title = document.createElement("div");
		grid_item_title.setAttribute("class", "grid_item_title");
		grid_item_title.innerHTML = `${code},${products[code].capitalize()}`;
		grid_item.appendChild(grid_item_title);
    grid_item.onclick = function(elem) {
      plotSelectedProduct(elem.target.id);
    };
    grid.appendChild(grid_item);
  }

}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function plotSelectedProduct(selected_product_code=default_product_code) {
  // let selector = document.getElementById("select-list");
  // let selected_product_code = selector[selector.selectedIndex].value;

  plotKilosBarPlot(selected_product_code, plotOptions);
  plotPreciosPlot(selected_product_code, plotOptions);
  plotLocalFraction(selected_product_code);

  // console.log(mejores_meses[selected_product_code]);
}

function selectMeanData() {
  plotOptions.plot_mean_values = true;
  plotSelectedProduct();
}

function selectFullData() {
  plotOptions.plot_mean_values = false;
  plotSelectedProduct();
}

function selectLocalToPlot() {
  plotOptions.plot_local = !plotOptions.plot_local;
  if (!plotOptions.plot_importacion && !plotOptions.plot_local) {
    plotOptions.plot_local = true;
  }
  plotSelectedProduct();
}

function selectImportacionToPlot() {
  plotOptions.plot_importacion = !plotOptions.plot_importacion;
  if (!plotOptions.plot_importacion && !plotOptions.plot_local) {
    plotOptions.plot_importacion = true;
  }
  plotSelectedProduct();
}

function extractKilosPlotData(code) {
  let fechas = Object.keys(kilos[code].local);
  let data_local = Object.values(kilos[code].local);
  let data_impor = Object.values(kilos[code].importacion);
  return {"fechas": fechas, "local": data_local, "importacion": data_impor}
}

function extractKilosMeanPlotData(code) {
  let local_data = kilos[code].local;
  let impor_data = kilos[code].importacion;
  let fechas = Object.keys(kilos[code].local);
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
   "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  let mean_values = {"local": {}, "importacion": {}};
  for (let month of months) {
    let filtered_fechas = fechas.filter(
      fecha => fecha.split("_")[0] === month);
    try {
      mean_values.local[month] = mean(filtered_fechas.map(
        fecha => local_data[fecha]));
    }
    catch(err) {
      mean_values.local[month] = 0;
    }
    try {
      mean_values.importacion[month] = mean(filtered_fechas.map(
        fecha => impor_data[fecha]));
    }
    catch(err) {
      mean_values.importacion[month] = 0;
    }
  }
  return mean_values
}

function extractPreciosMeanPlotData(code) {
  let fechas = Object.keys(precios[code].min.local);
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
   "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  let mean_values = {"local": {"min": {}, "max": {}, "moda": {}},
   "importacion": {"min": {}, "max": {}, "moda": {}}};
  for (let month of months) {
    let filtered_fechas = fechas.filter(
      fecha => fecha.split("_")[0] === month);
    try {
      mean_values.local.min[month] = mean(filtered_fechas.map(
        fecha => precios[code].min.local[fecha]));
      mean_values.local.max[month] = mean(filtered_fechas.map(
        fecha => precios[code].max.local[fecha]));
      mean_values.local.moda[month] = mean(filtered_fechas.map(
        fecha => precios[code].moda.local[fecha]));
    }
    catch(err) {
      mean_values.local.min[month] = NaN;
      mean_values.local.max[month] = NaN;
      mean_values.local.moda[month] = NaN;
    }
    try {
      mean_values.importacion.min[month] = mean(filtered_fechas.map(
        fecha => precios[code].min.importacion[fecha]));
      mean_values.importacion.max[month] = mean(filtered_fechas.map(
        fecha => precios[code].max.importacion[fecha]));
      mean_values.importacion.moda[month] = mean(filtered_fechas.map(
        fecha => precios[code].moda.importacion[fecha]));
    }
    catch(err) {
      mean_values.importacion.min[month] = NaN;
      mean_values.importacion.max[month] = NaN;
      mean_values.importacion.moda[month] = NaN;
    }
  }
  return mean_values
}

function extractPreciosPlotData(code) {
  let fechas = Object.keys(precios[code].min.local);
  let min_local = Object.values(precios[code].min.local);
  let min_impor = Object.values(precios[code].min.importacion);
  let max_local = Object.values(precios[code].max.local);
  let max_impor = Object.values(precios[code].max.importacion);
  let moda_local = Object.values(precios[code].moda.local);
  let moda_impor = Object.values(precios[code].moda.importacion);
  return {"fechas": fechas, "min_local": min_local, "max_local": max_local,
          "min_impor": min_impor, "max_impor": max_impor,
          "moda_local": moda_local, "moda_impor": moda_impor}
}

function computeLocallyProducedFraction(code, year=null) {
  let fechas = Object.keys(kilos[code].local);
  if (year === null) {
    let local_values = Object.values(kilos[code].local);
    let impor_values = Object.values(kilos[code].importacion);
    return sum(local_values) / (sum(local_values) + sum(impor_values))
  } else {
      let = filtered_fechas = fechas.filter(
        fecha => fecha.split("_")[1] === String(year)
      );
      let year_local_values = filtered_fechas.map(
        key => kilos[code].local[key]);
      let year_impor_values = filtered_fechas.map(
        key => kilos[code].importacion[key]);
      return sum(year_local_values) / (sum(year_local_values) + sum(year_impor_values))
  }
}

function filterKilosDataByYear(product_data, year) {
  let filtered_data = {"local": {}, "importacion": {}};
  let fechas = Object.keys(product_data.local);
  let = filtered_fechas = fechas.filter(
    fecha => fecha.split("_")[1] === String(year)
  );
  for (let fecha of filtered_fechas) {
    filtered_data.local[fecha] = product_data.local[fecha];
    filtered_data.importacion[fecha] = product_data.importacion[fecha];
  }
  return filtered_data
}

function filterPreciosDataByYear(product_data, year) {
  let filtered_data = {"min": {"local": {}, "importacion": {}},
   "max": {"local": {}, "importacion": {}},
   "moda": {"local": {}, "importacion": {}}};
  let fechas = Object.keys(product_data.local);
  let = filtered_fechas = fechas.filter(
    fecha => fecha.split("_")[1] === String(year)
  );
  for(let fecha of filtered_fechas) {
    filtered_data.min.local[fecha] = product_data.min.local[fecha];
    filtered_data.min.importacion[fecha] = product_data.min.importacion[fecha];
    filtered_data.max.local[fecha] = product_data.max.local[fecha];
    filtered_data.max.importacion[fecha] = product_data.max.importacion[fecha];
    filtered_data.moda.local[fecha] = product_data.moda.local[fecha];
    filtered_data.moda.importacion[fecha] = product_data.moda.importacion[fecha];
  }
  return filtered_data
}


function plotKilosBarPlot(code, options={"plot_mean_values": false, "plot_local": true, "plot_importacion": true}) {

  let x_tick_array = [];
  let local_array = [];
  let impor_array = [];

  if (options.plot_mean_values) {
    let data = extractKilosMeanPlotData(code);
    x_tick_array = Object.keys(data.local);
    local_array = Object.values(data.local);
    impor_array = Object.values(data.importacion);
  } else {
    let data = extractKilosPlotData(code);
    let years = data.fechas.map(f => f.split("_")[1]);
    let months = data.fechas.map(f => f.split("_")[0].slice(0, 3));
    x_tick_array = [years, months];
    local_array = data.local;
    impor_array = data.importacion;
  }

  let plot_data;
  let product_name = products[code];
  let trace1 = {
    x: x_tick_array,
    y: local_array,
    name: "Local",
    type: "bar",
    opacity: 0.5,
    marker: {
      color: local_color,
      line: {
        color: local_color,
        width: 0
      }
    }
  };
  let trace2 = {
    x: x_tick_array,
    y: impor_array,
    name: "Importación",
    type: "bar",
    opacity: 0.5,
    marker: {
      color: impor_color,
      line: {
        color: impor_color,
        width: 0
      }
    }
  };

  if (options.plot_local && !options.plot_importacion) {
    plot_data = [trace1];
  } else if (!options.plot_local && options.plot_importacion) {
    plot_data = [trace2];
  } else if (options.plot_local && options.plot_importacion) {
    plot_data = [trace1, trace2];
  }

  let layout = {
    barmode: "stack",
    title: `Kilos de ${product_name} producidos`,
    font: {
      color: fontColor
    },
    xaxis: {
      tickfont: {
        size: 10
      },
      // tickangle: 90,
      // tickson: "boundaries",
      // ticklen: 15,
     showdividers: true,
      // dividercolor: 'grey',
      // dividerwidth: 2
    },
    yaxis: {"title": "Kg"},
    plot_bgcolor: backgroundColor,
    paper_bgcolor: backgroundColor,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1
    },
    // margin: {
    //   l: 0,
    //   t: 0,
    //   b: 0
    // }
  };
  let config = {responsive: true};
  Plotly.newPlot("kilosplot", plot_data, layout, config);
}

function plotPreciosPlot(code, options={"plot_mean_values": false, "plot_local": true, "plot_importacion": true}) {
  let x_tick_array = [];
  let local_min_array = [];
  let local_max_array = [];
  let local_moda_array = [];
  let impor_min_array = [];
  let impor_max_array = [];
  let impor_moda_array = [];

  const impute_nans = function(array) {
    let imputed_array = [...array];
    let first_non_nan = array.findIndex(number => !isNaN(number));
    for (let i=first_non_nan + 1; i<array.length; i++) {
      if(isNaN(array[i])) {
        imputed_array[i] = imputed_array[i - 1];
      }
    }
    return imputed_array
  }

  if (options.plot_mean_values) {
    let data = extractPreciosMeanPlotData(code);
    x_tick_array = Object.keys(data.local.min);
    local_min_array = Object.values(data.local.min);
    impor_min_array = Object.values(data.importacion.min);
    local_max_array = Object.values(data.local.max);
    impor_max_array = Object.values(data.importacion.max);
    local_moda_array = Object.values(data.local.moda);
    impor_moda_array = Object.values(data.importacion.moda);
  } else {
    let data = extractPreciosPlotData(code);
    let years = data.fechas.map(f => f.split("_")[1]);
    let months = data.fechas.map(f => f.split("_")[0].slice(0, 3));
    x_tick_array = [years, months];
    local_min_array = data.min_local;
    local_max_array = data.max_local;
    local_moda_array = data.moda_local;
    impor_min_array = data.min_impor;
    impor_max_array = data.max_impor;
    impor_moda_array = data.moda_impor;
  }

  let plot_data;
  let product_name = products[code];
  let trace_min_local = {
    x: x_tick_array,
    y: impute_nans(local_min_array),
    name: "Local (min)",
    showlegend: false,
    line: {
      color: local_color
    }
  };
  let trace_max_local = {
    x: x_tick_array,
    y: impute_nans(local_max_array),
    name: "Local (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: local_color
    }
  };
  let trace_moda_local = {
    x: x_tick_array,
    y: impute_nans(local_moda_array),
    name: "Local",
    line: {
      color: local_color,
      dash: 'dashdot'
    }
  };
  let trace_min_impor = {
    x: x_tick_array,
    y: impute_nans(impor_min_array),
    name: "Importación (min)",
    showlegend: false,
    fillcolor: "transparent",
    line: {
      color: impor_color
    }
  };
  let trace_max_impor = {
    x: x_tick_array,
    y: impute_nans(impor_max_array),
    name: "Importación (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: impor_color
    }
  };
  let trace_moda_impor = {
    x: x_tick_array,
    y: impute_nans(impor_moda_array),
    name: "Importación",
    line: {
      color: impor_color,
      dash: "dashdot"
    }
  };

  if (options.plot_local && !options.plot_importacion) {
    plot_data = [trace_min_local, trace_max_local, trace_moda_local];
  } else if (!options.plot_local && options.plot_importacion) {
    plot_data = [trace_min_impor, trace_max_impor, trace_moda_impor];
  } else if (options.plot_local && options.plot_importacion) {
    plot_data = [trace_min_local, trace_max_local, trace_moda_local,
                 trace_min_impor, trace_max_impor, trace_moda_impor];
  }

  let layout = {
   title: `Evolución de precios de ${product_name}`,
   mode: "lines",
   font: {
     color: fontColor
   },
   xaxis: {
     tickfont: {
       size: 10
     },
     // tickson: "boundaries",
     // ticklen: 15,
   showdividers: true,
     // dividercolor: 'grey',
     // dividerwidth: 2,
     // tickangle: 90
   },
   yaxis: {title: "€ / Kg"},
   plot_bgcolor: backgroundColor,
   paper_bgcolor: backgroundColor,
   legend: {
    x: 1,
    xanchor: 'right',
    y: 1
   },
   // margin: {
   //   l: 0,
   //   t: 0,
   //   b: 0
   // }
  };
  let config = {responsive: true};
  Plotly.newPlot("preciosplot", plot_data, layout, config);
  // console.log(plot_data[0].y, plot_data[1].y);
}


function plotLocalFraction(code, year=null) {
  let local_fraction = computeLocallyProducedFraction(code, year);
  let data = [{
    values: [local_fraction, 1 - local_fraction],
    labels: ['Local', 'Importación'],
    type: 'pie',
    hoverinfo: 'label',
    hole: .4,
    marker: {
      colors: [local_color, impor_color]
    },
  }];

  let layout = {
    height: 400,
    width: 500,
    plot_bgcolor: backgroundColor,
    paper_bgcolor: backgroundColor,
    font: {
      color: fontColor
    }
  };
  Plotly.newPlot('pieplot', data, layout);
}



// initializeForm(products);
deployPictureGrid(products, type="frutas");
deployPictureGrid(products, type="verduras");
