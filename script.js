/* Visualización interactiva de las Estadísticas de compra-venta de productos
   de Mercatenerife.
   Semidán Robaina Estévez, 2020
*/

// if (window.innerHeight > window.innerWidth) {
//     alert("Please use Landscape!");
// }

if (window.matchMedia("(orientation: portrait)").matches) {
   alert("Please use Landscape!");
}

let backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--backgroundColor");
let fontColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--fontColor");


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
  changeSelectedProduct();
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

function changeSelectedProduct() {
  let selector = document.getElementById("select-list");
  let selected_product_code = selector[selector.selectedIndex].value;
  plotKilosBarPlot(selected_product_code);
  plotPreciosPlot(selected_product_code);
  console.log(mejores_meses[selected_product_code]);
  console.log(computeLocallyProducedFraction(selected_product_code, 2019));
}

function extractKilosPlotData(code) {
  let fechas = Object.keys(kilos[code].local);
  let data_local = Object.values(kilos[code].local);
  let data_impor = Object.values(kilos[code].importacion);
  return {"fechas": fechas, "local": data_local, "importacion": data_impor}
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
  let sum = function(array) {
    return array.reduce((a, b) => a + b, 0);
  }
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

function plotKilosBarPlot(code) {
  let data = extractKilosPlotData(code);
  let product_name = codigos[code];
  let trace1 = {
    x: data.fechas,
    y: data.local,
    name: "Local",
    type: "bar",
    opacity: 0.5,
    marker: {
      color: "rgb(9, 133, 208)",
      line: {
        color: 'rgb(8,48,107)',
        width: 0
      }
    }
  };
  let trace2 = {
    x: data.fechas,
    y: data.importacion,
    name: "Importación",
    type: "bar",
    opacity: 0.5,
    marker: {
      color: "rgb(221, 125, 6)",
      line: {
        color: 'rgb(221, 125, 6)',
        width: 0
      }
    }
  };
  let plot_data = [trace1, trace2];
  let layout = {
    barmode: "stack",
    title: `Kilos de ${product_name} producidos`,
    font: {
      color: fontColor
    },
    xaxis: {
      tickfont: {
        size: 5
      }
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

function plotPreciosPlot(code) {
  let data = extractPreciosPlotData(code);
  let product_name = codigos[code];
  let trace_min_local = {
    x: data.fechas,
    y: data.min_local,
    name: "Local (min)",
    showlegend: false,
    line: {
      color: "rgb(9, 133, 208)"
    }
  };
  let trace_max_local = {
    x: data.fechas,
    y: data.max_local,
    name: "Local (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: "rgb(9, 133, 208)"
    }
  };
  let trace_moda_local = {
    x: data.fechas,
    y: data.moda_local,
    name: "Local",
    line: {
      color: "rgb(0, 78, 125)",
      dash: 'dashdot'
    }
  };
  let trace_min_impor = {
    x: data.fechas,
    y: data.min_impor,
    name: "Importación (min)",
    showlegend: false,
    fill: "tozeroy",
    fillcolor: "transparent",
    line: {
      color: "rgb(208, 138, 3)"
    }
  };
  let trace_max_impor = {
    x: data.fechas,
    y: data.max_impor,
    name: "Importación (max)",
    showlegend: false,
    fill: 'tonexty',
    line: {
      color: "rgb(208, 138, 3)"
    }
  };
  let trace_moda_impor = {
    x: data.fechas,
    y: data.moda_impor,
    name: "Importación",
    line: {
      color: "rgb(189, 108, 0)",
      dash: "dashdot"
    }
  };

  let plot_data = [trace_min_local, trace_max_local, trace_moda_local,
                   trace_min_impor, trace_max_impor, trace_moda_impor];
  let layout = {
   title: `Evolución de precios de ${product_name}`,
   mode: "lines",
   font: {
     color: fontColor
   },
   xaxis: {
     tickfont: {
       size: 5
     },
     tickangle: 90
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


initializeForm(codigos);
