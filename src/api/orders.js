import axios from 'axios';

export async function createOrder(data) {
  // Bypassing the default API instance to target the original Orders microservice strictly on Port 8000
  const response = await axios.post('http://127.0.0.1:8000/api/orders', data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data; 
}

export async function fetchOutletOrders(outletId) {
  const response = await axios.get(`http://127.0.0.1:8000/api/outlet/orders?outletId=${outletId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function fetchOutletStock(outletId) {
  const response = await axios.get(`http://127.0.0.1:8000/api/outlet/products?outletId=${outletId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function receiveOrder(loadPlanId, data) {
  const response = await axios.post(`http://127.0.0.1:8000/api/outlet/loadplans/${loadPlanId}/receive`, data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function fetchOutletProductNames(outletId) {
  const response = await axios.get(`http://127.0.0.1:8000/api/outlet/product-names?outletId=${outletId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function recordSales(data) {
  const response = await axios.post(`http://127.0.0.1:8000/api/outlet/sales`, data, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function fetchReportData(type, date, outletId) {
  const url = `http://127.0.0.1:8000/api/reports/sales?type=${type}&date=${date}&outletId=${outletId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
}

export async function downloadSalesReport(type, date, outletId) {
  const url = `http://127.0.0.1:8000/api/reports/sales?type=${type}&date=${date}&outletId=${outletId}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  const data = response.data;
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
