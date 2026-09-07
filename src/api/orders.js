import api from './axios';

export async function createOrder(data) {
  return api.post('/orders', data);
}

export async function fetchOutletOrders(outletId) {
  return api.get(`/outlet/orders?outletId=${outletId}`);
}

export async function fetchOutletStock(outletId) {
  return api.get(`/outlet/products?outletId=${outletId}`);
}

export async function receiveOrder(loadPlanId, data) {
  return api.post(`/outlet/loadplans/${loadPlanId}/receive`, data);
}

export async function fetchOutletProductNames(outletId) {
  return api.get(`/outlet/product-names?outletId=${outletId}`);
}

export async function recordSales(data) {
  return api.post('/outlet/sales', data);
}

export async function fetchReportData(type, date, outletId) {
  return api.get(`/reports/sales?type=${type}&date=${date}&outletId=${outletId}`);
}

export async function downloadSalesReport(type, date, outletId) {
  const data = await api.get(`/reports/sales?type=${type}&date=${date}&outletId=${outletId}`);
  let csvContent = "";
  
  if (Array.isArray(data)) {
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      csvContent += keys.join(",") + "\n";
      data.forEach(row => {
        csvContent += keys.map(k => `"${(row[k] ?? '')}"`).join(",") + "\n";
      });
    }
  } else if (data && typeof data === 'object') {
    // Extract metrics keys (ignoring arrays/objects)
    const metricsKeys = Object.keys(data).filter(k => typeof data[k] !== 'object' && !Array.isArray(data[k]));
    if (metricsKeys.length > 0) {
      csvContent += "Metrics Summary\n";
      csvContent += metricsKeys.join(",") + "\n";
      csvContent += metricsKeys.map(k => `"${(data[k] ?? '')}"`).join(",") + "\n";
      csvContent += "\n";
    }

    // Extract itemized breakdown array
    const itemsArray = data.items || data.sales || data.products || data.data;
    if (Array.isArray(itemsArray) && itemsArray.length > 0) {
      csvContent += "Itemized Breakdown\n";
      const itemKeys = Object.keys(itemsArray[0]);
      csvContent += itemKeys.join(",") + "\n";
      itemsArray.forEach(row => {
        csvContent += itemKeys.map(k => `"${(row[k] ?? '')}"`).join(",") + "\n";
      });
    }
  } else {
    csvContent += "No data available.\n";
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  link.setAttribute('download', `sales-report-${type}-${date}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
