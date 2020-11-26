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

const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--backgroundColor");
const fontColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--fontColor");

let plotOptions = {
  "plot_mean": false,
  "plot_local": true,
  "plot_importacion": true
};

const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
 "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const local_color = "rgb(9, 133, 208)";
const impor_color = "rgb(221, 125, 6)";
const moda_color = "rgb(167, 167, 167)";
const default_product_code = 21206;
const selected_button_color = getComputedStyle(document.documentElement)
    .getPropertyValue("--fancyColor");
const unselected_button_color = getComputedStyle(document.documentElement)
    .getPropertyValue("--backgroundColor2");
let selected_product;
let grid_deployed = false;

const sum = function(array) {
  return array.reduce((a, b) => a + b, 0);
}

const mean = function(array) {
  return sum(array) / array.length
}

const std = function(array) {
  let mean_x = mean(array);
  let variance_x = mean(array.map(x => (x - mean_x)**2));
  let std_x = Math.sqrt(variance_x);
  return std_x
}

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

function getUniqueValues(array) {
  const unique = (value, index, self) => {
    return self.indexOf(value) === index
  };
  return array.filter(unique)
}

// function initializeForm(products) {
//   let form = 	document.getElementById("select-list");
//   for (let product of Object.values(products).sort()) {
//     let code = getKeyByValue(products, product);
//     let option = document.createElement("option");
//     option.text = product;
//     option.value = code;
//     option.setAttribute("id", code);
//     if (parseInt(code) === 21206) {
//       option.selected = "selected";
//     }
//     form.add(option);
//   }
//   plotSelectedProduct(default_product_code);
// }

function emptyProductsGrid() {
	let grid = document.getElementById("products_grid");
	grid.innerHTML = "";
	grid_deployed = false;
}

function deployPictureGrid(products, type="frutas") {
	/*
	type: "frutas, verduras or papas"
	*/
	emptyProductsGrid();
	let grid = document.getElementById("products_grid");
	let product_codes = product_classification[type];
  for (let code of product_codes) {
    let photo_name = Object.keys(
      product_pics).includes(String(code))? product_pics[code]: "no_photo.jpg";
    let grid_item = document.createElement("div");
    grid_item.setAttribute("class", "grid_item background_image");
		grid_item.setAttribute("id", code);
    grid_item.setAttribute("tabindex", "0");
		grid_item.style["background-image"] = `url(https://semidanrobaina.com/mercaTenerife/Resized_Photos/${photo_name})`;
		let grid_item_title = document.createElement("div");
		grid_item_title.setAttribute("class", "grid_item_title");
		grid_item_title.innerHTML = `${code},${products[code].capitalize()}`;
		grid_item.appendChild(grid_item_title);
    grid_item.onclick = function(elem) {
      plotSelectedProduct(elem.target.id);
			emptyProductsGrid();
			grid.scrollIntoView();
    };
    grid.appendChild(grid_item);
  }
	grid_deployed = true;
}

function selectFruits() {
	if (grid_deployed) {
		emptyProductsGrid();
	} else {
		deployPictureGrid(products, type="frutas");
	}
	// grid_deployed = !grid_deployed;
}

function selectVeggies() {
	if (grid_deployed) {
		emptyProductsGrid();
	} else {
		deployPictureGrid(products, type="verduras");
	}
	// grid_deployed = !grid_deployed;
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function plotSelectedProduct(selected_product_code=default_product_code) {
  // let selector = document.getElementById("select-list");
  // let selected_product_code = selector[selector.selectedIndex].value;
  selected_product = selected_product_code;
	let product_name = products[selected_product_code];
	let name_div = document.getElementById("product_name");
	name_div.innerHTML = `<p>${product_name}</p>`;
	let product_pic_div = document.getElementById("product_pic");
	let pic_name = product_pics[selected_product_code] === undefined? "no_photo.jpg": product_pics[selected_product_code];
	let pic_url = `https://semidanrobaina.com/mercaTenerife/Resized_Photos/${pic_name}`;
	product_pic_div.style["background-image"] = `url(${pic_url})`;

	changePlotButtonColor();
  plotKilosBarPlot(selected_product_code, plotOptions);
  plotPreciosPlot(selected_product_code, plotOptions);
  plotLocalFraction(selected_product_code);
	fillInProductData(selected_product_code);

	console.log(displayDailyProductPrice(selected_product_code));
}

function fillInProductData(code) {
	let k_values = getKilosExtremeValues(code);
	let p_values = getPreciosExtremeValues(code);
	let impor_day_price = getImporProductDayPrice(code);
	let local_day_price = getLocalProductDayPrice(code);
	let product_best_months = mejores_meses[code];
	let div = document.getElementById("product_data");

	let innerHTML = '';

	if (local_day_price !== undefined) {
		let precio_dia_local = `<p>Precio día local: ${local_day_price.moda} € / Kg</p>`;
		innerHTML += precio_dia_local;
	}
  if (impor_day_price !== undefined) {
		let precio_dia_impor = `<p>Precio día importación: ${impor_day_price.moda} € / Kg</p>`;
		innerHTML += precio_dia_impor;
	}
	if (p_values.local_min !== Infinity) {
		let precio_local = `<p>Precio local: ${p_values.local_min} - ${p_values.local_max} € / Kg</p>`;
		innerHTML += precio_local;
	}
	if (p_values.impor_min !== Infinity) {
		let precio_impor = `<p>Precio importación: ${p_values.impor_min} - ${p_values.impor_max} € / Kg</p>`;
		innerHTML += precio_impor;
	}
	if (k_values.local_max !== 0) {
		let kilos_local = `<p>Cantidad mensual local: ${k_values.local_min} - ${k_values.local_max} Kg</p>`;
		innerHTML += kilos_local;
	}
	if (k_values.impor_max !== 0) {
		let kilos_impor = `<p>Cantidad mensual importación: ${k_values.impor_min} - ${k_values.impor_max} Kg</p>`;
		innerHTML += kilos_impor;
	}
	if (product_best_months.length > 0) {
		let temporada = `<p>Mayor producción: ${product_best_months.join(" - ")}</p>`;
		innerHTML += temporada;
	}
	div.innerHTML = innerHTML;
}

function getLocalProductDayPrice(code) {
	try {
		return {min: daily_prices[code].local.min, max: daily_prices[code].local.max, moda: daily_prices[code].local.moda.replace(",", ".")}
  } catch {
		return undefined
	}
}

function getImporProductDayPrice(code) {
	try {
		return {min: daily_prices[code].importacion.min, max: daily_prices[code].importacion.max, moda: daily_prices[code].importacion.moda.replace(",", ".")}
  } catch {
	return undefined
  }
}

function displayDailyProductPrice(code) {
	// Computes day prices difference with the mean mode across years
	// for the same month.

	let current_date = new Date();
	let current_month = months[current_date.getMonth()];
	let day_price = daily_prices[code];
	if (day_price === undefined) {return "No hay datos disponibles"}
	let mean_prices= extractPreciosMeanPlotData(code);
	let day_keys = Object.keys(day_price);
	let mean_keys = Object.keys(mean_prices);
	let has_local_data = day_keys.includes("local") && mean_keys.includes("local") && !isNaN(mean_prices.local.moda[current_month]);
	let has_impor_data = day_keys.includes("importacion") && mean_keys.includes("importacion") && !isNaN(mean_prices.importacion.moda[current_month]);

  const print_diff = function(diff) {
		let qualifier;
		if (diff < 0) {qualifier = "más barato"};
		if (diff > 0) {qualifier = "más caro"};
		if (diff === 0) {qualifier = "al mismo precio"};
		let res = `El producto está un ${100*Math.abs(diff).toFixed(2)}% ${qualifier} que el precio medio de ${current_month.capitalize()}`;
		return res
	}

	if (has_local_data && has_impor_data) {
    let out = {};
		// let min_impor = daily_prices[code].importacion.min;
		// let max_impor = daily_prices[code].importacion.max;
		// let min_local = daily_prices[code].local.min;
		// let max_local = daily_prices[code].local.max;
		let mean_local_moda = mean_prices.local.moda[current_month];
		let day_local_moda = parseFloat(day_price.local.moda.replace(",", "."));
		let local_diff = (day_local_moda - mean_local_moda) / mean_local_moda;
		let mean_impor_moda = mean_prices.importacion.moda[current_month];
		let day_impor_moda = parseFloat(day_price.importacion.moda.replace(",", "."));
		let impor_diff = (day_impor_moda - mean_impor_moda) / mean_impor_moda;
		return {local: print_diff(local_diff), importacion: print_diff(impor_diff)}

	} else if (has_local_data & !has_impor_data) {
		let min_local = daily_prices[code].local.min;
		let max_local = daily_prices[code].local.max;
		let mean_local_moda = mean_prices.local.moda[current_month];
		let day_local_moda = parseFloat(day_price.local.moda.replace(",", "."));
		let local_diff = (day_local_moda - mean_local_moda) / mean_local_moda;
		return {local: print_diff(local_diff)}

	} else if (has_impor_data & !has_local_data) {
		let min_impor = daily_prices[code].importacion.min;
		let max_impor = daily_prices[code].importacion.max;
		let mean_impor_moda = mean_prices.importacion.moda[current_month];
		let day_impor_moda = parseFloat(day_price.importacion.moda.replace(",", "."));
		let impor_diff = (day_impor_moda - mean_impor_moda) / mean_impor_moda;
		return {importacion: print_diff(impor_diff)}

	} else if (!has_local_data && !has_impor_data) {
		return "No hay datos disponibles"
	}
}

function selectMeanOrFullData() {
	let mean_switch = document.getElementById("mean_data_switch");
	if (mean_switch.checked) {
		selectMeanData();
	} else {
		selectFullData();
	}
}

// function selectLocalOrImportData() {
// 	let local_switch = document.getElementById("local_data_switch");
// 	if (local_switch.checked) {
// 		selectLocalToPlot();
// 	} else {
// 		selectImportacionToPlot();
// 	}
// }

function selectMeanData() {
  plotOptions.plot_mean_values = true;
  plotSelectedProduct(selected_product);
}

function selectFullData() {
  plotOptions.plot_mean_values = false;
  plotSelectedProduct(selected_product);
}

function changePlotButtonColor() {
	let local_button = document.getElementById("select-local-data");
	let impor_button = document.getElementById("select-importacion-data");
	if (plotOptions.plot_local) {
		local_button.style["background-color"] = selected_button_color;
	} else {
		local_button.style["background-color"] = unselected_button_color;
	}
	if (plotOptions.plot_importacion) {
		impor_button.style["background-color"] = selected_button_color;
	} else {
		impor_button.style["background-color"] = unselected_button_color;
	}
}

function selectLocalToPlot() {
  plotOptions.plot_local = !plotOptions.plot_local;
  // if (!plotOptions.plot_importacion && !plotOptions.plot_local) {
  //   plotOptions.plot_local = true;
  // }
  plotSelectedProduct(selected_product);
}

function selectImportacionToPlot() {
  plotOptions.plot_importacion = !plotOptions.plot_importacion;
  // if (!plotOptions.plot_importacion && !plotOptions.plot_local) {
  //   plotOptions.plot_importacion = true;
  // }
  plotSelectedProduct(selected_product);
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
  let min_local = impute_nans(Object.values(precios[code].min.local));
  let min_impor = impute_nans(Object.values(precios[code].min.importacion));
  let max_local = impute_nans(Object.values(precios[code].max.local));
  let max_impor = impute_nans(Object.values(precios[code].max.importacion));
  let moda_local = impute_nans(Object.values(precios[code].moda.local));
  let moda_impor = impute_nans(Object.values(precios[code].moda.importacion));
  return {"fechas": fechas, "min_local": min_local, "max_local": max_local,
          "min_impor": min_impor, "max_impor": max_impor,
          "moda_local": moda_local, "moda_impor": moda_impor}
}

function getKilosExtremeValues(code) {
	let kilos_data = extractKilosPlotData(code);
	return {
		"local_min": Math.min(...kilos_data.local),
		"local_max": Math.max(...kilos_data.local),
		"local_mean": mean(kilos_data.local),
		"impor_min": Math.min(...kilos_data.importacion),
		"impor_max": Math.max(...kilos_data.importacion),
		"impor_mean": mean(kilos_data.importacion)
	}
}

function getPreciosExtremeValues(code) {
	let precios_data = extractPreciosPlotData(code);
	return {
		"local_min": Math.min(...precios_data.min_local.filter(v => !isNaN(v))),
		"local_max": Math.max(...precios_data.max_local.filter(v => !isNaN(v))),
		"impor_min": Math.min(...precios_data.min_impor.filter(v => !isNaN(v))),
		"impor_max": Math.max(...precios_data.max_impor.filter(v => !isNaN(v)))
	}
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
  // let product_name = products[code];
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
    // title: `Kilos de ${product_name} producidos`,
		title: `Kilos producidos`,
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
  // let product_name = products[code];
  let trace_min_local = {
    x: x_tick_array,
    y: local_min_array,
    name: "Local (min)",
    showlegend: false,
    line: {
      color: local_color
    }
  };
  let trace_max_local = {
    x: x_tick_array,
    y: local_max_array,
    name: "Local (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: local_color
    }
  };
  let trace_moda_local = {
    x: x_tick_array,
    y: local_moda_array,
    name: "Local",
    line: {
      color: local_color,
      dash: 'dashdot'
    }
  };
  let trace_min_impor = {
    x: x_tick_array,
    y: impor_min_array,
    name: "Importación (min)",
    showlegend: false,
    fillcolor: "transparent",
    line: {
      color: impor_color
    }
  };
  let trace_max_impor = {
    x: x_tick_array,
    y: impor_max_array,
    name: "Importación (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: impor_color
    }
  };
  let trace_moda_impor = {
    x: x_tick_array,
    y: impor_moda_array,
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
   // title: `Evolución de precios de ${product_name}`,
	 title: `Evolución de precios`,
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
}


function plotLocalFraction(code, year=null) {
	let container_width = document.getElementById("pieplot").clientWidth;
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
    height: container_width,
    width: container_width,
    plot_bgcolor: backgroundColor,
    paper_bgcolor: backgroundColor,
    font: {
      color: fontColor
    },
		margin: { t: 0, b: 0, l: 0, r: 0, pad: 0 },
		legend: {
		 x: 1,
		 xanchor: 'right',
		 y: 1
		}
  };
  Plotly.newPlot('pieplot', data, layout);
}


// initializeForm(products);
plotSelectedProduct(default_product_code);
// deployPictureGrid(products, type="frutas");
// deployPictureGrid(products, type="verduras");
