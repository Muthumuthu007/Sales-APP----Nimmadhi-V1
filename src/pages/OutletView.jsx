import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Calendar, FileText, Gift, MapPin, PackageSearch, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { createOrder, fetchOutletOrders, fetchOutletStock, receiveOrder, fetchOutletProductNames, recordSales, fetchDueCustomers, downloadSalesReport, fetchReportData } from '../api/orders';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchOutletEmployees, createOutletEmployee, updateEmployeeSalary } from '../api/employees';
import { getOutletLocation, updateOutletLocation } from '../api/location';
import { fetchActiveOutletOffers } from '../api/offers';

import { AuthContext } from '../context/AuthContext';
import EmployeeAttendance from './EmployeeAttendance';
import QRUnitReceive from './QRUnitReceive';
import './OutletView.css';

const OutletView = () => {
  const { outletId, role } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(() => (
    ['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR'].includes(role) ? 'ATTENDANCE' : 'CREATE_ORDER'
  ));

  const outletTabs = [
    { id: 'CREATE_ORDER', label: 'Create Order' },
    { id: 'MY_ORDERS', label: 'My Orders' },
    { id: 'STOCK', label: 'Stock View' },
    { id: 'QR_RECEIVE', label: 'Receive QR Units' },
    { id: 'SALES', label: 'Sales Entry' },
    { id: 'DUE_CUSTOMERS', label: 'Pending Payments' },
    { id: 'REPORTS', label: 'Reports' },
    { id: 'MANAGE_EMPLOYEES', label: 'Manage Employees' },
    { id: 'OUTLET_LOCATION', label: 'Outlet Location' },
  ];
  const employeeTabs = [
    { id: 'ATTENDANCE', label: 'Attendance' },
    { id: 'CREATE_ORDER', label: 'Create Order' },
    { id: 'MY_ORDERS', label: 'My Orders' },
    { id: 'STOCK', label: 'Stock View' },
    { id: 'QR_RECEIVE', label: 'Receive QR Units' },
    { id: 'SALES', label: 'Sales Entry' },
    { id: 'DUE_CUSTOMERS', label: 'Pending Payments' },
    { id: 'REPORTS', label: 'Reports' },
  ];
  const tabs = ['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR'].includes(role) ? employeeTabs : outletTabs;

  // --- Create Order State ---
  const [productOptions, setProductOptions] = useState([{ label: 'Loading products...', value: '' }]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get('/products');
        const list = response?.products || [];
        const options = [
          { label: 'Select a product...', value: '' },
          ...list.map(p => {
            if (typeof p === 'object' && p !== null) {
              const id = p.id || p.product_id || p._id || p.uuid;
              const name = p.name || p.product_name || p.productName || p.title || p.description;
              return {
                label: name || id || 'Unknown Product',
                value: id || name,
                group: p.group_name || p.groupName || 'Ungrouped'
              };
            }
            return { label: String(p), value: String(p) };
          })
        ];
        setProductOptions(options);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProductOptions([{ label: 'Error loading products', value: '' }]);
      }
    }
    fetchProducts();
  }, []);

  const [outletProductNames, setOutletProductNames] = useState([]);

  useEffect(() => {
    if (outletId) {
      fetchOutletProductNames(outletId).then(response => {
        const list = Array.isArray(response) ? response : (response?.products || []);
        setOutletProductNames(list);
      }).catch((err) => {
        console.error('Failed to fetch outlet product names:', err);
      });
    }
  }, [outletId]);

  const [items, setItems] = useState([]);
  const [selectedProductGroup, setSelectedProductGroup] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const productGroups = useMemo(() => (
    [...new Set(
      productOptions
        .filter(option => option.value && option.group)
        .map(option => option.group)
    )].sort((left, right) => left.localeCompare(right))
  ), [productOptions]);

  // An outlet may only order from groups assigned to it by the manager. Keep a
  // concrete group selected, rather than offering an "all products" view that
  // can make the outlet's permitted catalogue look unrestricted.
  useEffect(() => {
    if (!productGroups.length) {
      setSelectedProductGroup('');
      setSelectedProduct('');
      return;
    }
    if (!productGroups.includes(selectedProductGroup)) {
      setSelectedProductGroup(productGroups[0]);
      setSelectedProduct('');
    }
  }, [productGroups, selectedProductGroup]);

  const visibleProductOptions = useMemo(() => {
    const placeholder = productOptions.find(option => !option.value) || { label: 'Select a product...', value: '' };
    const products = productOptions.filter(option => option.value);
    return [
      placeholder,
      ...products.filter(option => option.group === selectedProductGroup)
    ];
  }, [productOptions, selectedProductGroup]);

  const productNameById = useMemo(() => new Map(
    productOptions
      .filter((option) => option.value && option.label)
      .map((option) => [String(option.value), option.label])
  ), [productOptions]);

  // --- My Orders State ---
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [viewOrderTarget, setViewOrderTarget] = useState(null);

  // --- Stock View State ---
  const [stockItems, setStockItems] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);

  // --- Receive Order State ---
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveOrderTarget, setReceiveOrderTarget] = useState(null);
  const [receiveItems, setReceiveItems] = useState({});
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState(null);

  // --- Sales Entry State ---
  const [salesProductOptions, setSalesProductOptions] = useState([{ label: 'Loading products...', value: '' }]);
  const [ownedShowroomSales, setOwnedShowroomSales] = useState(false);
  const [salesItems, setSalesItems] = useState([]);
  const [salesProduct, setSalesProduct] = useState('');
  const [salesQuantity, setSalesQuantity] = useState(1);
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [billAmount, setBillAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isSubmittingSales, setIsSubmittingSales] = useState(false);
  const [salesError, setSalesError] = useState(null);
  const [salesSuccess, setSalesSuccess] = useState(null);
  const [dueCustomers, setDueCustomers] = useState([]);
  const [dueCustomersLoading, setDueCustomersLoading] = useState(false);
  const [dueCustomersError, setDueCustomersError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);

  const handleAddSalesItem = () => {
    if (!salesProduct) {
      setSalesError('Please select a product.');
      return;
    }
    if (salesQuantity <= 0) {
      setSalesError('Quantity must be greater than 0.');
      return;
    }
    const existingIndex = salesItems.findIndex(i => i.product_id === salesProduct);
    if (existingIndex >= 0) {
      const newItems = [...salesItems];
      newItems[existingIndex].quantity += Number(salesQuantity);
      setSalesItems(newItems);
    } else {
      setSalesItems([...salesItems, { product_id: salesProduct, quantity: Number(salesQuantity) }]);
    }
    setSalesProduct('');
    setSalesQuantity(1);
    setSalesError(null);
    setSalesSuccess(null);
  };

  useEffect(() => {
    if (!['SALES', 'CREATE_ORDER'].includes(activeTab)) return;
    fetchActiveOutletOffers().then((response) => setActiveOffers(response?.offers || [])).catch(() => setActiveOffers([]));
  }, [activeTab]);

  const removeSalesItem = (idxToRemove) => {
    setSalesItems(salesItems.filter((_, idx) => idx !== idxToRemove));
    setSalesError(null);
  };

  const handleRecordSalesSubmit = async () => {
    if (salesItems.length === 0) {
      setSalesError('Add at least one item to record sales.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setSalesError('Customer name, phone number, and address are required.');
      return;
    }
    const parsedBillAmount = Number(billAmount);
    const parsedAdvanceAmount = Number(advanceAmount || 0);
    if (!Number.isFinite(parsedBillAmount) || parsedBillAmount <= 0 || !Number.isFinite(parsedAdvanceAmount) || parsedAdvanceAmount < 0 || parsedAdvanceAmount > parsedBillAmount) {
      setSalesError('Enter a valid bill amount and an advance amount that does not exceed it.');
      return;
    }
    setIsSubmittingSales(true);
    setSalesError(null);
    setSalesSuccess(null);

    try {
      const submittedItems = salesItems.map((item) => ({ ...item, productName: getProductName(item.product_id) }));
      const result = await recordSales({
        outletId: outletId,
        date: salesDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod,
        billAmount: parsedBillAmount,
        advanceAmount: parsedAdvanceAmount,
        soldItems: salesItems.map(i => ({ product_id: i.product_id, qty: i.quantity }))
      });
      setReceipt({ ...result, items: submittedItems });
      setSalesSuccess('Sales invoice created successfully.');
      setSalesItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setPaymentMethod('CASH');
      setBillAmount('');
      setAdvanceAmount('');
    } catch (err) {
      setSalesError(err.response?.data?.message || err.message || 'Failed to record sales.');
    } finally {
      setIsSubmittingSales(false);
    }
  };

  // --- Reports State ---
  const [reportView, setReportView] = useState('list'); // 'list', 'daily', 'weekly', 'monthly'
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReportError(null);
    try {
      const data = await fetchReportData(reportView, reportDate, outletId);
      setReportData(data);
    } catch (err) {
      setReportError(err.response?.data?.message || err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    setReportError(null);
    try {
      await downloadSalesReport(reportView, reportDate, outletId);
    } catch (err) {
      setReportError(err.response?.data?.message || err.message || 'Failed to download report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReceiveClick = (order) => {
    setReceiveOrderTarget(order);
    // Keep every field intentionally blank.  Only quantities entered here are
    // submitted; products not delivered yet remain outstanding for this order.
    setReceiveItems({});
    setReceiveError(null);
    setReceiveModalOpen(true);
  };

  const handleReceiveQtyChange = (productId, qty) => {
    setReceiveItems((prev) => ({
      ...prev,
      [productId]: Number(qty)
    }));
  };

  const handleReceiveSubmit = async () => {
    if (!receiveOrderTarget) return;
    setIsReceiving(true);
    setReceiveError(null);
    
    const receivedItemsArr = Object.entries(receiveItems)
      .map(([product_id, qty]) => ({ product_id, qty: Number(qty) }))
      .filter((item) => Number.isInteger(item.qty) && item.qty > 0);

    if (!receivedItemsArr.length) {
      setReceiveError('Enter the quantity received for at least one product. Leave products that have not arrived blank.');
      return;
    }

    const payload = {
      orderId: receiveOrderTarget.orderId || receiveOrderTarget.id,
      outletId: outletId,
      receivedItems: receivedItemsArr
    };

    const planId = receiveOrderTarget.loadPlanId || payload.orderId;

    try {
      const result = await receiveOrder(planId, payload);
      
      setOrdersLoading(true);
      const response = await fetchOutletOrders(outletId);
      const updatedOrders = Array.isArray(response) ? response : (response?.orders || []);
      setMyOrders(updatedOrders);
      if (result.isReceived) {
        setReceiveModalOpen(false);
        setReceiveOrderTarget(null);
      } else {
        const outstandingOrder = updatedOrders.find((order) => (order.orderId || order.id) === payload.orderId);
        setReceiveOrderTarget(outstandingOrder || receiveOrderTarget);
        setReceiveItems({});
        setReceiveError(null);
      }
      setOrdersLoading(false);
    } catch (err) {
      setReceiveError(err.response?.data?.message || err.message || 'Failed to receive order.');
      setOrdersLoading(false);
    } finally {
      setIsReceiving(false);
    }
  };

  // --- Employee Management State ---
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [employeeSubmitError, setEmployeeSubmitError] = useState(null);
  const [employeeSubmitSuccess, setEmployeeSubmitSuccess] = useState(null);

  // Form fields
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empDesignation, setEmpDesignation] = useState('SALES');
  const [empSalaryModel, setEmpSalaryModel] = useState('MONTHLY');
  const [empBasicSalary, setEmpBasicSalary] = useState('');
  const [empOvertimeRate, setEmpOvertimeRate] = useState('');

  // --- Employee Salary Configuration State ---
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState(null);
  const [salaryConfigModalOpen, setSalaryConfigModalOpen] = useState(false);
  const [configSalaryModel, setConfigSalaryModel] = useState('MONTHLY');
  const [configBasicSalary, setConfigBasicSalary] = useState('');
  const [configPerDayRate, setConfigPerDayRate] = useState('');
  const [configOvertimeRate, setConfigOvertimeRate] = useState('');
  const [configAllowancesDefault, setConfigAllowancesDefault] = useState('');
  const [configDeductionsDefault, setConfigDeductionsDefault] = useState('');
  const [isSavingSalaryConfig, setIsSavingSalaryConfig] = useState(false);
  const [salaryConfigError, setSalaryConfigError] = useState(null);
  const [salaryConfigSuccess, setSalaryConfigSuccess] = useState(null);

  // --- Outlet Location State ---
  const [locationCoords, setLocationCoords] = useState({ latitude: null, longitude: null });
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const fetchLocation = async () => {
    if (!outletId) return;
    setLocationLoading(true);
    setLocationError(null);
    try {
      const response = await getOutletLocation(outletId);
      const data = response || {};
      const lat = data.latitude ?? null;
      const lng = data.longitude ?? null;
      setLocationCoords({ latitude: lat, longitude: lng });
      setInputLat(lat !== null ? String(lat) : '');
      setInputLng(lng !== null ? String(lng) : '');
    } catch (err) {
      if (err.response?.status !== 404) {
        setLocationError(err.response?.data?.message || err.message || 'Failed to fetch current outlet location.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!inputLat.trim() || !inputLng.trim()) {
      setLocationError('Please enter both latitude and longitude coordinates.');
      return;
    }

    const latNum = Number(inputLat);
    const lngNum = Number(inputLng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setLocationError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setLocationError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setLocationSaving(true);
    setLocationError(null);
    setLocationSuccess(null);

    try {
      await updateOutletLocation(outletId, {
        latitude: latNum,
        longitude: lngNum
      });
      setLocationSuccess('Outlet boundary location saved successfully!');
      setLocationCoords({ latitude: latNum, longitude: lngNum });
    } catch (err) {
      setLocationError(err.response?.data?.message || err.message || 'Failed to update boundary location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInputLat(String(position.coords.latitude));
        setInputLng(String(position.coords.longitude));
        setIsDetecting(false);
      },
      (error) => {
        let msg = 'Failed to detect location. ';
        if (error.code === error.PERMISSION_DENIED) {
          msg += 'Please grant location permissions in your browser.';
        } else {
          msg += error.message;
        }
        setLocationError(msg);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCreateEmployee = async () => {
    if (!empName.trim()) {
      setEmployeeSubmitError('Employee name is required.');
      return;
    }
    if (!empPhone.trim()) {
      setEmployeeSubmitError('Phone number is required.');
      return;
    }
    if (!empPassword) {
      setEmployeeSubmitError('Password is required.');
      return;
    }
    if (!empBasicSalary || Number(empBasicSalary) <= 0) {
      setEmployeeSubmitError('Basic salary must be greater than 0.');
      return;
    }
    if (!empOvertimeRate || Number(empOvertimeRate) < 0) {
      setEmployeeSubmitError('Overtime rate cannot be negative.');
      return;
    }

    setIsSubmittingEmployee(true);
    setEmployeeSubmitError(null);
    setEmployeeSubmitSuccess(null);

    const payload = {
      outletId: outletId || 'OUT001',
      name: empName.trim(),
      phone: empPhone.trim(),
      password: empPassword,
      role: 'EMPLOYEE',
      designation: empDesignation,
      salaryModel: empSalaryModel,
      basicSalary: Number(empBasicSalary),
      overtimeRate: Number(empOvertimeRate)
    };

    try {
      await createOutletEmployee(payload);
      setEmployeeSubmitSuccess('Employee registered successfully!');
      
      // Clear form
      setEmpName('');
      setEmpPhone('');
      setEmpPassword('');
      setEmpDesignation('SALES');
      setEmpSalaryModel('MONTHLY');
      setEmpBasicSalary('');
      setEmpOvertimeRate('');
      
      // Reload list
      setEmployeesLoading(true);
      const response = await fetchOutletEmployees(outletId);
      const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
      setEmployeesList(list);
      setEmployeesLoading(false);
      
      // Wait a moment and close modal
      setTimeout(() => {
        setEmployeeModalOpen(false);
        setEmployeeSubmitSuccess(null);
      }, 1500);
      
    } catch (err) {
      setEmployeeSubmitError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to register employee.');
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleOpenSalaryConfig = (employee) => {
    setSelectedEmployeeForSalary(employee);
    const sal = employee.salary || {};
    setConfigSalaryModel(sal.salaryModel || 'MONTHLY');
    setConfigBasicSalary(sal.basicSalary !== undefined && sal.basicSalary !== null ? String(sal.basicSalary) : '');
    setConfigPerDayRate(sal.perDayRate !== undefined && sal.perDayRate !== null ? String(sal.perDayRate) : '');
    setConfigOvertimeRate(sal.overtimeRate !== undefined && sal.overtimeRate !== null ? String(sal.overtimeRate) : '');
    setConfigAllowancesDefault(sal.allowancesDefault !== undefined && sal.allowancesDefault !== null ? String(sal.allowancesDefault) : '');
    setConfigDeductionsDefault(sal.deductionsDefault !== undefined && sal.deductionsDefault !== null ? String(sal.deductionsDefault) : '');
    
    setSalaryConfigError(null);
    setSalaryConfigSuccess(null);
    setSalaryConfigModalOpen(true);
  };

  const handleSaveSalaryConfig = async () => {
    if (!selectedEmployeeForSalary) return;
    
    // Validation Rules
    if (!outletId) {
      setSalaryConfigError('Outlet ID is mandatory.');
      return;
    }
    
    if (configSalaryModel !== 'MONTHLY' && configSalaryModel !== 'PER_DAY') {
      setSalaryConfigError('Salary Model must be MONTHLY or PER_DAY.');
      return;
    }

    if (configSalaryModel === 'MONTHLY') {
      if (configBasicSalary === '' || Number(configBasicSalary) < 0) {
        setSalaryConfigError('Basic salary is required and must be >= 0.');
        return;
      }
    }

    if (configSalaryModel === 'PER_DAY') {
      if (configPerDayRate === '' || Number(configPerDayRate) < 0) {
        setSalaryConfigError('Per day rate is required and must be >= 0.');
        return;
      }
    }

    // Numeric validations
    if (configBasicSalary !== '' && Number(configBasicSalary) < 0) {
      setSalaryConfigError('Basic salary cannot be negative.');
      return;
    }
    if (configPerDayRate !== '' && Number(configPerDayRate) < 0) {
      setSalaryConfigError('Per day rate cannot be negative.');
      return;
    }
    if (configOvertimeRate !== '' && Number(configOvertimeRate) < 0) {
      setSalaryConfigError('Overtime rate cannot be negative.');
      return;
    }
    if (configAllowancesDefault !== '' && Number(configAllowancesDefault) < 0) {
      setSalaryConfigError('Default allowances cannot be negative.');
      return;
    }
    if (configDeductionsDefault !== '' && Number(configDeductionsDefault) < 0) {
      setSalaryConfigError('Default deductions cannot be negative.');
      return;
    }

    setIsSavingSalaryConfig(true);
    setSalaryConfigError(null);
    setSalaryConfigSuccess(null);

    const payload = {
      outletId: outletId,
      salaryModel: configSalaryModel,
      basicSalary: configSalaryModel === 'MONTHLY' ? Number(configBasicSalary) : 0,
      perDayRate: configSalaryModel === 'PER_DAY' ? Number(configPerDayRate) : 0,
      overtimeRate: configOvertimeRate !== '' ? Number(configOvertimeRate) : 0,
      allowancesDefault: configAllowancesDefault !== '' ? Number(configAllowancesDefault) : 0,
      deductionsDefault: configDeductionsDefault !== '' ? Number(configDeductionsDefault) : 0
    };

    try {
      const targetEmpId = selectedEmployeeForSalary.empId || selectedEmployeeForSalary.id;
      await updateEmployeeSalary(targetEmpId, payload);
      setSalaryConfigSuccess('Employee salary updated successfully!');
      
      // Reload list
      setEmployeesLoading(true);
      const response = await fetchOutletEmployees(outletId);
      const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
      setEmployeesList(list);
      setEmployeesLoading(false);
      
      setTimeout(() => {
        setSalaryConfigModalOpen(false);
        setSalaryConfigSuccess(null);
      }, 1500);
    } catch (err) {
      setSalaryConfigError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update employee salary.');
    } finally {
      setIsSavingSalaryConfig(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (activeTab === 'MY_ORDERS' && outletId) {
      setOrdersLoading(true);
      setOrdersError(null);
      
      fetchOutletOrders(outletId).then(response => {
        if (isMounted) {
          setMyOrders(Array.isArray(response) ? response : (response?.orders || []));
          setOrdersLoading(false);
        }
      }).catch(err => {
        if (isMounted) {
          setOrdersError(err.response?.data?.message || err.message || 'Failed to fetch your outlet orders.');
          setOrdersLoading(false);
        }
      });
    } else if (activeTab === 'STOCK' && outletId) {
      setStockLoading(true);
      setStockError(null);
      
      fetchOutletStock(outletId).then(response => {
        if (isMounted) {
          const stockProducts = Array.isArray(response) ? response : (response?.products || []);
          setStockItems(stockProducts.map((product) => ({
            ...product,
            productName: product.productName
              || product.product_name
              || productNameById.get(String(product.product_id || product.productId))
              || 'Product name unavailable',
          })));
          setStockLoading(false);
        }
      }).catch(err => {
        if (isMounted) {
          setStockError(err.response?.data?.message || err.message || 'Failed to fetch live stock flow.');
          setStockLoading(false);
        }
      });
    } else if (activeTab === 'SALES' && outletId) {
      fetchOutletProductNames(outletId).then(response => {
        if (isMounted) {
          const list = Array.isArray(response) ? response : (response?.products || []);
          setOwnedShowroomSales(Boolean(response?.ownedShowroom));
          const options = [
             { label: 'Select a product...', value: '' },
             ...list.map(p => ({
               label: `${p.name || p.product_name || p.productName || p.title || String(p.id || p.product_id)}${response?.ownedShowroom ? ` — max produce: ${p.maxProduce ?? 0}` : ''}`,
               value: String(p.id || p.product_id)
             }))
          ];
          setSalesProductOptions(options);
        }
      }).catch(() => {
        if (isMounted) {
           setOwnedShowroomSales(false);
           setSalesProductOptions([{ label: 'Error loading options', value: '' }]);
        }
      });
    } else if (activeTab === 'DUE_CUSTOMERS' && outletId) {
      setDueCustomersLoading(true);
      setDueCustomersError(null);
      fetchDueCustomers(outletId).then((response) => {
        if (isMounted) {
          setDueCustomers(response?.customers || []);
          setDueCustomersLoading(false);
        }
      }).catch((error) => {
        if (isMounted) {
          setDueCustomersError(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load pending customer payments.');
          setDueCustomersLoading(false);
        }
      });
    } else if (activeTab === 'MANAGE_EMPLOYEES' && outletId) {
      setEmployeesLoading(true);
      setEmployeesError(null);
      
      fetchOutletEmployees(outletId).then(response => {
        if (isMounted) {
          const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
          setEmployeesList(list);
          setEmployeesLoading(false);
        }
      }).catch(err => {
        if (isMounted) {
          setEmployeesError(err.response?.data?.message || err.message || 'Failed to fetch employees.');
          setEmployeesLoading(false);
        }
      });
    } else if (activeTab === 'OUTLET_LOCATION' && outletId) {
      fetchLocation();
    }
    
    return () => { isMounted = false; };
  }, [activeTab, outletId, productNameById]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      setApiError('Please select a product.');
      return;
    }
    if (quantity <= 0) {
      setApiError('Quantity must be greater than 0.');
      return;
    }
    // Check if product already exists in items, maybe increment quantity
    const existingIndex = items.findIndex(item => item.product_id === selectedProduct);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += Number(quantity);
      setItems(newItems);
    } else {
      setItems([...items, { product_id: selectedProduct, quantity: Number(quantity) }]);
    }
    
    setSelectedProduct('');
    setQuantity(1);
    setApiError(null);
    setSuccessMsg(null);
  };

  const removeItem = (idxToRemove) => {
    setItems(items.filter((_, idx) => idx !== idxToRemove));
    setApiError(null);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      setApiError('Ensure at least one item exists before submitting.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        outletId: outletId || 'OUT001',
        items: items
      };
      const data = await createOrder(payload);
      
      setSuccessMsg(`Order created successfully! Tracking ID: ${data.orderId}`);
      setItems([]); // reset form
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to resolve product name
  const getProductName = (id) => {
    if (!id) return '-';
    // 1. Search in outlet product names (port 8000)
    const foundOutletProd = outletProductNames.find(
      p => String(p.id || p.product_id || p.productId) === String(id)
    );
    if (foundOutletProd) {
      return foundOutletProd.productName || foundOutletProd.product_name || foundOutletProd.name;
    }

    // 2. Search in general product options (port 8001)
    const foundGeneralProd = productOptions.find(o => String(o.value) === String(id));
    if (foundGeneralProd && foundGeneralProd.value !== '') {
      return foundGeneralProd.label;
    }

    return id;
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const offerSummary = (offer) => {
    const purchasedProducts = (offer.qualifyingProducts || [])
      .map((product) => product.productName || product.productId)
      .filter(Boolean);
    const main = purchasedProducts.join(', ') || offer.qualifyingLabel || (offer.scope === 'OUTLET' ? 'Any product at this outlet' : offer.groupName || offer.productName || offer.groupId || offer.productId || 'Eligible product');
    const complimentary = Number(offer.freeQuantity || 0) > 0
      ? `Main: ${main} → Complimentary: ${offer.freeProductName || offer.freeProductId || 'Product'} × ${offer.freeQuantity}`
      : `Main: ${main} → ${offer.discountType === 'PERCENT' ? `${offer.discountValue}% discount` : `₹${offer.discountValue} discount`}`;
    return complimentary;
  };

  const complimentarySummary = (offers = []) => offers
    .filter((offer) => Number(offer.freeQuantity || 0) > 0)
    .map(offerSummary)
    .join(' | ') || '-';

  const sendReceiptToCustomer = async () => {
    if (!receipt) return;
    const text = [
      'NIMMADHI MATTRESS',
      `Invoice: ${receipt.saleReferenceId || '-'}`,
      `Customer: ${receipt.customerName}`,
      `Bill amount: ${formatCurrency(receipt.billAmount)}`,
      `Paid now: ${formatCurrency(receipt.advanceAmount)}`,
      `Balance due: ${formatCurrency(receipt.balanceDue)}`,
      `Payment method: ${receipt.paymentMethod}`,
      'Thank you for choosing Nimmadhi Mattress.',
    ].join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Nimmadhi Mattress invoice', text });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    window.location.href = `sms:${receipt.customerPhone}?body=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!(activeTab === 'REPORTS' && reportView !== 'list') && (
        <div className="outlet-tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`outlet-tab-btn${activeTab === tab.id ? ' outlet-tab-btn--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div>
        {activeTab === 'ATTENDANCE' && <EmployeeAttendance />}
        {activeTab === 'CREATE_ORDER' && (
          <Card className="order-builder-card">
            <CardHeader title="Create a new order" action={<span className="order-builder-step">Build your order</span>} />
            <CardContent className="order-builder-content">
              <div className="order-builder-intro">
                <div className="order-builder-intro-icon"><ShoppingBag size={20} /></div>
                <div><h3>Choose products by production group</h3><p>Select a group first, then add the product and quantity to your order.</p></div>
              </div>
              
              {apiError && (
                <div className="order-builder-alert order-builder-alert-error">
                  {apiError}
                </div>
              )}

              {successMsg && (
                <div className="order-builder-alert order-builder-alert-success">
                  {successMsg}
                </div>
              )}

              {activeOffers.length > 0 && (
                <section className="sales-builder-offers" aria-label="Current outlet offers">
                  <Gift size={19} />
                  <div><strong>Complimentary products and discounts</strong><span>{activeOffers.map(offerSummary).join(' | ')}</span></div>
                </section>
              )}

              <div className="order-builder-workspace">
                <section className="order-builder-groups">
                  <div className="order-builder-section-label"><span>1</span><div><strong>Production group</strong><small>Start with a collection</small></div></div>
                  <div className="order-builder-group-grid">
                    {productGroups.map(group => {
                      const count = productOptions.filter(option => option.group === group).length;
                      return <button type="button" key={group} className={`order-builder-group ${selectedProductGroup === group ? 'selected' : ''}`} onClick={() => { setSelectedProductGroup(group); setSelectedProduct(''); }}><span>{group}</span><small>{count}</small></button>;
                    })}
                  </div>
                </section>
                <section className="order-builder-selection">
                  <div className="order-builder-section-label"><span>2</span><div><strong>Product and quantity</strong><small>{selectedProductGroup ? `${selectedProductGroup} products only` : 'Select a production group'}</small></div></div>
                  <SearchableSelect label="Select product" options={visibleProductOptions} value={selectedProduct} onChange={(val) => setSelectedProduct(val)} placeholder={selectedProductGroup ? `Select a ${selectedProductGroup} product...` : 'Select a production group first'} />
                  <div className="order-builder-add-row">
                    <Input label="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <Button className="order-builder-add-button" onClick={handleAddItem} disabled={isSubmitting}><Plus size={18} /> Add item</Button>
                  </div>
                </section>
              </div>
              
              <div className="order-builder-summary">
                <div className="order-builder-summary-heading"><PackageSearch size={19} /><div><h4>Order summary</h4><span>{items.length} {items.length === 1 ? 'product' : 'products'} selected</span></div></div>
                {items.length === 0 ? (
                  <div className="order-builder-empty">
                    Select a group and add products to begin your order.
                  </div>
                ) : (
                  <div className="order-builder-items">
                    {items.map((item, idx) => (
                      <div key={idx} className="order-builder-item">
                        <span className="order-builder-item-quantity">{item.quantity}</span>
                        <span className="order-builder-item-name">{getProductName(item.product_id)}</span>
                        <Button variant="secondary" className="order-builder-remove" onClick={() => removeItem(idx)} disabled={isSubmitting} aria-label={`Remove ${getProductName(item.product_id)}`}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button className="order-builder-submit" onClick={handleSubmitOrder} disabled={isSubmitting || items.length === 0}>
                <ShoppingBag size={18} /> {isSubmitting ? 'Submitting order…' : 'Submit order'}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'MY_ORDERS' && (
          <Card>
            <CardHeader title="Order History" />
            <CardContent style={{ padding: 0 }}>
              {ordersLoading ? (
                <div style={{ padding: '3rem 0' }}>
                  <LoadingState message="Fetching your historical orders..." />
                </div>
              ) : ordersError ? (
                <div style={{ padding: '1.5rem' }}>
                  <ErrorState error={ordersError} onRetry={() => setActiveTab('MY_ORDERS')} />
                </div>
              ) : (
                <Table 
                  columns={[
                    { key: 'orderId', label: 'Order ID' },
                    { key: 'createdAt', label: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
                    { key: 'items', label: 'Items Count', align: 'center', render: (row) => row.items?.length || 0 },
                    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
                    { key: 'actions', label: 'Actions', render: (row) => (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="secondary" onClick={() => setViewOrderTarget(row)}>View</Button>
                        {row.status === 'DISPATCHED' && <Button size="sm" onClick={() => handleReceiveClick(row)}>Receive</Button>}
                      </div>
                    ) }
                  ]} 
                  data={myOrders}
                  emptyStateMessage="No tracked operational orders found for your outlet."
                />
              )}
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={Boolean(viewOrderTarget)}
          onClose={() => setViewOrderTarget(null)}
          title={`Order ${viewOrderTarget?.displayId || viewOrderTarget?.orderId || ''}`}
        >
          {viewOrderTarget && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div><div className="text-muted" style={{ fontSize: '0.8rem' }}>ORDER ID</div><strong>{viewOrderTarget.displayId || viewOrderTarget.orderId}</strong></div>
                <Badge status={viewOrderTarget.status} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <span><strong>Created:</strong> {viewOrderTarget.createdAt ? new Date(viewOrderTarget.createdAt).toLocaleString() : '-'}</span>
                {viewOrderTarget.remarks && <span><strong>Remarks:</strong> {viewOrderTarget.remarks}</span>}
              </div>
              <Table
                columns={[
                  { key: 'productName', label: 'Product', render: (item) => item.productName || getProductName(item.product_id) || item.product_id },
                  { key: 'orderedQty', label: 'Ordered', align: 'center', render: (item) => item.orderedQty ?? item.quantity ?? 0 },
                  { key: 'approvedQty', label: 'Approved', align: 'center', render: (item) => item.approvedQty ?? 0 },
                  { key: 'pendingQty', label: 'Pending', align: 'center', render: (item) => item.pendingQty ?? 0 },
                ]}
                data={viewOrderTarget.items || []}
                emptyStateMessage="This order does not contain any item details."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setViewOrderTarget(null)}>Close</Button></div>
            </div>
          )}
        </Modal>

        {activeTab === 'STOCK' && (
          <Card>
            <CardHeader title="Current Inventory & Stock Flow" />
            <CardContent style={{ padding: 0 }}>
              {stockLoading ? (
                <div style={{ padding: '3rem 0' }}>
                  <LoadingState message="Fetching live stock data..." />
                </div>
              ) : stockError ? (
                <div style={{ padding: '1.5rem' }}>
                  <ErrorState error={stockError} onRetry={() => setActiveTab('STOCK')} />
                </div>
              ) : (
                <Table 
                  columns={[
                    { key: 'productName', label: 'Product Name', render: (row) => row.productName || 'Product name unavailable' },
                    { key: 'openingQty', label: 'Opening', align: 'center', render: (row) => row.openingQty || 0 },
                    { key: 'receivedQty', label: 'Received', align: 'center', render: (row) => row.receivedQty || 0 },
                    { key: 'soldQty', label: 'Sold', align: 'center', render: (row) => row.soldQty || 0 },
                    { key: 'closingQty', label: 'Closing', align: 'center', render: (row) => row.closingQty || 0 },
                    { key: 'lastUpdated', label: 'Last Updated', render: (row) => row.lastUpdated ? new Date(row.lastUpdated).toLocaleDateString() : '-' }
                  ]} 
                  data={stockItems}
                  emptyStateMessage="No tracked operational inventory found."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'QR_RECEIVE' && <QRUnitReceive />}

        {activeTab === 'SALES' && (
          <Card className="sales-builder-card">
            <CardHeader title="Record daily sales" action={<span className="sales-builder-step">Sales entry</span>} />
            <CardContent className="sales-builder-content">
              <div className="sales-builder-intro">
                <div className="sales-builder-intro-icon"><Calendar size={20} /></div>
                <div><h3>Capture today’s sales</h3><p>Add each sold product, review the summary, then submit one complete record.</p></div>
              </div>
              
              {salesError && (
                <div className="order-builder-alert order-builder-alert-error">
                  {salesError}
                </div>
              )}

              {salesSuccess && (
                <div className="order-builder-alert order-builder-alert-success">
                  {salesSuccess}
                </div>
              )}

              {activeOffers.length > 0 && (
                <section className="sales-builder-offers" aria-label="Current outlet offers">
                  <Gift size={19} />
                  <div><strong>Current outlet offers</strong><span>{activeOffers.map(offerSummary).join(' | ')}</span></div>
                </section>
              )}

              {ownedShowroomSales && (
                <div className="order-builder-alert order-builder-alert-info">
                  <strong>NIMMADHI Outlet — Factory delivery</strong><br />
                  Products can be ordered without local showroom stock. Each quantity is checked against the current max producible quantity before the order is accepted.
                </div>
              )}

              <div className="sales-builder-workspace">
                <section className="sales-builder-date-card">
                  <div className="order-builder-section-label"><span>1</span><div><strong>Sales date</strong><small>Choose the date for this entry</small></div></div>
                  <Input type="date" label="Date of sale" value={salesDate} onChange={(e) => setSalesDate(e.target.value)} />
                </section>
                <section className="sales-builder-date-card sales-builder-customer-card">
                  <div className="order-builder-section-label"><span>2</span><div><strong>Customer details</strong><small>Required for every sales receipt</small></div></div>
                  <Input label="Customer name" placeholder="e.g. S. Kumar" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input label="Customer phone number" type="tel" placeholder="e.g. 9876543210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  <Input label="Customer address" placeholder="House, street, area, city" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                  <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'UPI', label: 'UPI' },
                  ]} />
                  <Input label="Total bill amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
                  <Input label="Amount paid now (advance)" type="number" min="0" step="0.01" placeholder="0.00" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
                  {billAmount && <div className="sales-builder-payment-summary">Balance due: <strong>{formatCurrency(Math.max(0, Number(billAmount) - Number(advanceAmount || 0)))}</strong></div>}
                </section>
                <section className="sales-builder-entry-card">
                  <div className="order-builder-section-label"><span>3</span><div><strong>Sold product</strong><small>{ownedShowroomSales ? 'Factory-delivery products are limited by max producible quantity' : 'Only products available at this outlet are listed'}</small></div></div>
                  <SearchableSelect label="Select product" options={salesProductOptions} value={salesProduct} onChange={(val) => setSalesProduct(val)} placeholder={ownedShowroomSales ? 'Search factory products...' : 'Search available products...'} />
                  <div className="sales-builder-add-row">
                    <Input label="Quantity sold" type="number" min="1" value={salesQuantity} onChange={(e) => setSalesQuantity(e.target.value)} />
                    <Button className="order-builder-add-button" onClick={handleAddSalesItem} disabled={isSubmittingSales}><Plus size={18} /> Add sale</Button>
                  </div>
                </section>
              </div>

              <div className="order-builder-summary">
                <div className="order-builder-summary-heading"><PackageSearch size={19} /><div><h4>Sales summary</h4><span>{salesItems.length} {salesItems.length === 1 ? 'product' : 'products'} added</span></div></div>
                {salesItems.length === 0 ? (
                  <div className="order-builder-empty">
                    Add sold products to prepare today’s sales record.
                  </div>
                ) : (
                  <div className="order-builder-items">
                    {salesItems.map((item, idx) => (
                      <div key={idx} className="order-builder-item">
                        <span className="order-builder-item-quantity">{item.quantity}</span>
                        <span className="order-builder-item-name">{salesProductOptions.find(o => o.value === item.product_id)?.label || item.product_id}</span>
                        <Button variant="secondary" className="order-builder-remove" onClick={() => removeSalesItem(idx)} disabled={isSubmittingSales} aria-label="Remove sales item">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="order-builder-submit" onClick={handleRecordSalesSubmit} disabled={isSubmittingSales || salesItems.length === 0}>
                <ShoppingBag size={18} /> {isSubmittingSales ? 'Recording sales…' : 'Submit sales record'}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'DUE_CUSTOMERS' && (
          <Card>
            <CardHeader title="Pending customer payments" action={<span className="sales-builder-step">Advance payments awaiting balance</span>} />
            <CardContent style={{ padding: 0 }}>
              {dueCustomersLoading ? (
                <div style={{ padding: '3rem 0' }}><LoadingState message="Loading pending customer payments…" /></div>
              ) : dueCustomersError ? (
                <div style={{ padding: '1.5rem' }}><ErrorState error={dueCustomersError} onRetry={() => setActiveTab('DUE_CUSTOMERS')} /></div>
              ) : (
                <Table
                  columns={[
                    { key: 'customerName', label: 'Customer' },
                    { key: 'customerPhone', label: 'Phone' },
                    { key: 'customerAddress', label: 'Address', render: (row) => row.customerAddress || '-' },
                    { key: 'products', label: 'Products', render: (row) => (
                      <div className="pending-payment-products">
                        {(row.products || []).map((product) => (
                          <div key={product.productId || product.productName}>
                            {product.productName || product.productId} <strong>× {product.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    ) },
                    { key: 'saleDate', label: 'Invoice date', render: (row) => row.saleDate ? new Date(row.saleDate).toLocaleDateString() : '-' },
                    { key: 'billAmount', label: 'Bill', align: 'right', render: (row) => formatCurrency(row.billAmount) },
                    { key: 'advanceAmount', label: 'Paid', align: 'right', render: (row) => formatCurrency(row.advanceAmount) },
                    { key: 'balanceDue', label: 'Balance due', align: 'right', render: (row) => <strong>{formatCurrency(row.balanceDue)}</strong> },
                  ]}
                  data={dueCustomers}
                  emptyStateMessage="No pending customer payments for this outlet."
                />
              )}
            </CardContent>
          </Card>
        )}

        <Modal isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} title="Sales invoice">
          {receipt && (
            <article className="sales-receipt">
              <header className="sales-receipt-header"><div><p className="sales-receipt-kicker">NIMMADHI</p><h2>MATTRESS</h2><span>Get your sleep</span></div><div className="sales-receipt-invoice"><span>INVOICE</span><strong>{receipt.saleReferenceId || '-'}</strong><small>{receipt.saleDate}</small></div></header>
              <section className="sales-receipt-customer"><div><span>BILLED TO</span><strong>{receipt.customerName}</strong><p>{receipt.customerPhone}<br />{receipt.customerAddress}</p></div><div><span>PAYMENT</span><strong>{receipt.paymentMethod}</strong><p>{receipt.paymentStatus === 'PAID' ? 'Paid in full' : 'Advance payment received'}</p></div></section>
              <table className="sales-receipt-items"><thead><tr><th>Product</th><th>Quantity</th></tr></thead><tbody>{(receipt.items || []).map((item, index) => <tr key={`${item.product_id}-${index}`}><td>{item.productName || item.product_id}</td><td>{item.quantity}</td></tr>)}</tbody></table>
              {(receipt.eligibleOffers || []).some((offer) => Number(offer.freeQuantity || 0) > 0) && <section className="sales-receipt-offers"><strong>Complimentary items</strong>{(receipt.eligibleOffers || []).filter((offer) => Number(offer.freeQuantity || 0) > 0).map((offer) => <p key={offer.offerId}>{offerSummary(offer)}</p>)}</section>}
              <section className="sales-receipt-totals"><div><span>Total bill</span><strong>{formatCurrency(receipt.billAmount)}</strong></div><div><span>Paid now</span><strong>{formatCurrency(receipt.advanceAmount)}</strong></div><div className="sales-receipt-balance"><span>Balance due</span><strong>{formatCurrency(receipt.balanceDue)}</strong></div></section>
              <footer>Thank you for choosing Nimmadhi Mattress. Please retain this invoice for your records.</footer>
              <div className="sales-receipt-actions"><Button variant="secondary" onClick={() => window.print()}>Print receipt</Button><Button onClick={sendReceiptToCustomer}>Send receipt</Button></div>
            </article>
          )}
        </Modal>

        {activeTab === 'REPORTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {reportView === 'list' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <Card 
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg)' }} 
                  onClick={() => { setReportView('daily'); setReportData(null); setReportError(null); }}
                >
                  <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ backgroundColor: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>Daily Reports</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>View detailed daily production and inventory reports</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg)' }} 
                  onClick={() => { setReportView('weekly'); setReportData(null); setReportError(null); }}
                >
                  <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ backgroundColor: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>Weekly Reports</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Analyze weekly trends and performance metrics</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg)' }} 
                  onClick={() => { setReportView('monthly'); setReportData(null); setReportError(null); }}
                >
                  <CardContent style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ backgroundColor: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>Monthly Reports</h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Track monthly production and inventory statistics</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ 
                  color: 'white',
                  padding: '1.5rem', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'linear-gradient(90deg, #155e75 0%, #0f766e 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button 
                      onClick={() => setReportView('list')} 
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
                    >
                       &larr; Back
                    </button>
                    <div>
                      <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{reportView.charAt(0).toUpperCase() + reportView.slice(1)} Report</h2>
                      <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>View detailed {reportView} stock and activity reports</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', padding: '0.25rem' }}>
                      <Calendar size={16} color="white" style={{ margin: '0 0.5rem' }} />
                      <input 
                        type="date" 
                        value={reportDate} 
                        onChange={(e) => setReportDate(e.target.value)} 
                        style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: 'white', outline: 'none' }}
                      />
                    </div>
                    <Button variant="secondary" onClick={handleDownloadReport} disabled={isDownloading} style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#0f766e', border: 'none' }}>
                      {isDownloading ? 'Downloading...' : 'Download Excel'}
                    </Button>
                    <Button onClick={handleGenerateReport} disabled={isGenerating} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                      {isGenerating ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </div>

                {reportError && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px' }}>
                    {reportError}
                  </div>
                )}

                <Card>
                  <CardContent style={{ padding: (reportData && (Array.isArray(reportData) ? reportData.length > 0 : Object.keys(reportData).length > 0)) ? '1.5rem' : '4rem 1rem', textAlign: (reportData && (Array.isArray(reportData) ? reportData.length > 0 : Object.keys(reportData).length > 0)) ? 'left' : 'center' }}>
                    {(!reportData || (Array.isArray(reportData) && reportData.length === 0) || (typeof reportData === 'object' && !Array.isArray(reportData) && Object.keys(reportData).length === 0)) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)' }}>
                        <FileText size={48} opacity={0.5} />
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0', color: 'inherit' }}>No {reportView.charAt(0).toUpperCase() + reportView.slice(1)} Report Data Available</h3>
                          <p style={{ margin: 0 }}>Select a date and click "Generate Report" to view the data</p>
                        </div>
                      </div>
                    ) : Array.isArray(reportData) ? (
                      <div style={{ overflowX: 'auto' }}>
                        <Table 
                          columns={[
                            { key: 'id', label: 'ID', render: (row, i) => row.id || row._id || i+1 },
                            { key: 'name', label: 'Item/Category', render: (row) => row.name || row.product_id || '-' },
                            { key: 'qty', label: 'Quantity', align: 'center', render: (row) => row.qty || row.quantity || row.soldQty || 0 },
                            { key: 'date', label: 'Date', render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-' }
                          ]}
                          data={reportData}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', fontSize: '1.125rem' }}>Report Metrics Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid var(--color-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Sales / Transactions</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{reportData.totalSales ?? reportData.totalTransactions ?? reportData.totalOrders ?? 0}</p>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Units Sold / Processed</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{reportData.totalQuantity ?? reportData.totalUnits ?? reportData.totalQty ?? 0}</p>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue Value</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>₹{(reportData.totalAmount || reportData.totalRevenue || reportData.revenue || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        {reportData.startDate && reportData.endDate && (
                          <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-secondary)', borderRadius: '6px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', border: '1px solid var(--color-border)' }}>
                            <Calendar size={16} color="var(--color-text-muted)" />
                            <span><strong>Period Covered:</strong> {new Date(reportData.startDate).toLocaleDateString()} &mdash; {new Date(reportData.endDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {(reportData.items || reportData.sales || reportData.products || reportData.data) && Array.isArray(reportData.items || reportData.sales || reportData.products || reportData.data) && (
                          <div style={{ overflowX: 'auto', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Itemized Breakdown</h4>
                            <Table 
                              columns={[
                                { key: 'id', label: 'S.No', render: (row, i) => (i !== undefined ? i + 1 : '-') },
                                { key: 'product', label: 'Product Name', render: (row) => row.productName || row.product_name || getProductName(row.productId || row.product_id || row.name) },
                                { key: 'total_qty', label: 'Total Qty', align: 'center', render: (row) => row.totalQty ?? row.total_qty ?? row.quantity ?? 0 },
                                { key: 'complimentary', label: 'Complimentary', render: (row) => complimentarySummary(row.eligibleOffers) },
                                { key: 'amount', label: 'Amount', align: 'right', render: (row) => row.amount || row.totalAmount || row.revenue ? `₹${Number(row.amount || row.totalAmount || row.revenue).toLocaleString()}` : '-' },
                                { key: 'date', label: 'Date', render: (row) => (row.saleTimestamp || row.saleDate || row.date) ? new Date(row.saleTimestamp || row.saleDate || row.date).toLocaleDateString() : '-' }
                              ]}
                              data={reportData.items || reportData.sales || reportData.products || reportData.data}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        )}

        {activeTab === 'MANAGE_EMPLOYEES' && (
          <Card>
            <CardHeader 
              title="Employee Directory" 
              action={
                <Button onClick={() => {
                  setEmployeeSubmitError(null);
                  setEmployeeSubmitSuccess(null);
                  setEmployeeModalOpen(true);
                }}>
                  Add Employee
                </Button>
              }
            />
            <CardContent style={{ padding: 0 }}>
              {employeesLoading ? (
                <div style={{ padding: '3rem 0' }}>
                  <LoadingState message="Fetching employees list..." />
                </div>
              ) : employeesError ? (
                <div style={{ padding: '1.5rem' }}>
                  <ErrorState error={employeesError} onRetry={() => {
                    setEmployeesLoading(true);
                    setEmployeesError(null);
                    fetchOutletEmployees(outletId).then(response => {
                      const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
                      setEmployeesList(list);
                      setEmployeesLoading(false);
                    }).catch(err => {
                      setEmployeesError(err.response?.data?.message || err.message || 'Failed to fetch employees.');
                      setEmployeesLoading(false);
                    });
                  }} />
                </div>
              ) : (
                <Table 
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'designation', label: 'Designation', render: (row) => row.designation || row.role },
                    { key: 'salaryModel', label: 'Salary Model', render: (row) => (row.salary?.salaryModel === 'MONTHLY' ? 'Monthly' : 'Daily / Per Day') },
                    { key: 'basicSalary', label: 'Basic Salary', align: 'right', render: (row) => row.salary?.salaryModel === 'MONTHLY' ? `₹${Number(row.salary?.basicSalary || 0).toLocaleString()}` : '-' },
                    { key: 'perDayRate', label: 'Per Day Rate', align: 'right', render: (row) => row.salary?.salaryModel === 'PER_DAY' || row.salary?.salaryModel === 'DAILY' ? `₹${Number(row.salary?.perDayRate || 0).toLocaleString()}` : '-' },
                    { key: 'overtimeRate', label: 'OT Rate / Hr', align: 'right', render: (row) => `₹${Number(row.salary?.overtimeRate || 0).toLocaleString()}` },
                    { 
                      key: 'actions', 
                      label: 'Actions', 
                      align: 'center', 
                      render: (row) => (
                        <Button 
                          variant="secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSalaryConfig(row);
                          }}
                        >
                          Configure Salary
                        </Button>
                      )
                    }
                  ]} 
                  data={employeesList}
                  emptyStateMessage="No registered employees found for this outlet."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'OUTLET_LOCATION' && (
          <Card style={{ maxWidth: '600px' }}>
            <CardHeader title="Outlet Boundary Settings" />
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--color-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                <MapPin size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                  Define the precise geographic coordinate center of your storefront. 
                  The employee attendance checks will require staff to check in within 100 meters of these boundary configurations.
                </p>
              </div>

              {locationError && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
                  {locationError}
                </div>
              )}

              {locationSuccess && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
                  {locationSuccess}
                </div>
              )}

              {locationLoading ? (
                <LoadingState message="Fetching currently registered coordinates..." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: '#fafbfc' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Registered Latitude</span>
                      <strong style={{ fontSize: '1rem' }}>{locationCoords.latitude !== null ? locationCoords.latitude : 'Not Configured'}</strong>
                    </div>
                    <div style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: '#fafbfc' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Registered Longitude</span>
                      <strong style={{ fontSize: '1rem' }}>{locationCoords.longitude !== null ? locationCoords.longitude : 'Not Configured'}</strong>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Update Outlet Coordinates</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input 
                      label="Latitude" 
                      placeholder="e.g. 12.950416"
                      value={inputLat}
                      onChange={(e) => setInputLat(e.target.value)}
                      disabled={locationSaving || isDetecting}
                    />
                    <Input 
                      label="Longitude" 
                      placeholder="e.g. 77.712240"
                      value={inputLng}
                      onChange={(e) => setInputLng(e.target.value)}
                      disabled={locationSaving || isDetecting}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <Button 
                      variant="secondary" 
                      onClick={handleDetectLocation}
                      disabled={locationSaving || isDetecting}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {isDetecting ? 'Detecting GPS...' : 'Detect Current Location'}
                    </Button>
                    
                    <Button 
                      variant="primary" 
                      onClick={handleSaveLocation}
                      disabled={locationSaving || isDetecting || !inputLat.trim() || !inputLng.trim()}
                    >
                      {locationSaving ? 'Saving...' : 'Save Location'}
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )}
      </div>

      <Modal 
        isOpen={receiveModalOpen} 
        onClose={() => !isReceiving && setReceiveModalOpen(false)} 
        title={`Receive Order ${receiveOrderTarget?.orderId || receiveOrderTarget?.id || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {receiveError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {receiveError}
            </div>
          )}
          <p>Enter only the products received now. Leave all other products blank; they will remain here until they arrive.</p>
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(receiveOrderTarget?.receiptItems || receiveOrderTarget?.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                <span style={{flex: 1}}>
                  {item.productName || getProductName(item.product_id)} (Outstanding: {item.remainingQty ?? item.quantity})
                </span>
                <Input 
                  type="number" 
                  min="0" 
                  max={item.remainingQty ?? item.quantity}
                  placeholder="0"
                  value={receiveItems[item.product_id] ?? ''}
                  onChange={(e) => handleReceiveQtyChange(item.product_id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setReceiveModalOpen(false)} disabled={isReceiving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReceiveSubmit} disabled={isReceiving}>
              {isReceiving ? 'Saving...' : 'Save received quantities'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={employeeModalOpen}
        onClose={() => !isSubmittingEmployee && setEmployeeModalOpen(false)}
        title="Register New Employee"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {employeeSubmitError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {employeeSubmitError}
            </div>
          )}
          {employeeSubmitSuccess && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {employeeSubmitSuccess}
            </div>
          )}

          <Input 
            label="Employee Name" 
            placeholder="e.g. Ravi Kumar"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Input 
            label="Phone Number" 
            placeholder="e.g. 9999999999"
            value={empPhone}
            onChange={(e) => setEmpPhone(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Input 
            label="Password" 
            type="password"
            placeholder="Enter employee password"
            value={empPassword}
            onChange={(e) => setEmpPassword(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Select 
            label="Designation"
            options={[
              { label: 'Sales', value: 'SALES' },
              { label: 'Cashier', value: 'CASHIER' },
              { label: 'Delivery', value: 'DELIVERY' },
              { label: 'Helper', value: 'HELPER' },
              { label: 'Manager', value: 'MANAGER' }
            ]}
            value={empDesignation}
            onChange={(e) => setEmpDesignation(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Select 
            label="Salary Model"
            options={[
              { label: 'Monthly', value: 'MONTHLY' },
              { label: 'Daily', value: 'DAILY' }
            ]}
            value={empSalaryModel}
            onChange={(e) => setEmpSalaryModel(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Input 
            label="Basic Salary (₹)" 
            type="number"
            placeholder="e.g. 15000"
            value={empBasicSalary}
            onChange={(e) => setEmpBasicSalary(e.target.value)}
            disabled={isSubmittingEmployee}
          />
          <Input 
            label="Overtime Rate (₹ / hr)" 
            type="number"
            placeholder="e.g. 100"
            value={empOvertimeRate}
            onChange={(e) => setEmpOvertimeRate(e.target.value)}
            disabled={isSubmittingEmployee}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button 
              variant="secondary" 
              onClick={() => setEmployeeModalOpen(false)} 
              disabled={isSubmittingEmployee}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateEmployee} 
              disabled={isSubmittingEmployee}
            >
              {isSubmittingEmployee ? 'Registering...' : 'Register Employee'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={salaryConfigModalOpen}
        onClose={() => !isSavingSalaryConfig && setSalaryConfigModalOpen(false)}
        title={`Configure Salary - ${selectedEmployeeForSalary?.name || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {salaryConfigError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {salaryConfigError}
            </div>
          )}
          {salaryConfigSuccess && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
              {salaryConfigSuccess}
            </div>
          )}

          <Select 
            label="Salary Model"
            options={[
              { label: 'Monthly', value: 'MONTHLY' },
              { label: 'Daily / Per Day', value: 'PER_DAY' }
            ]}
            value={configSalaryModel}
            onChange={(e) => setConfigSalaryModel(e.target.value)}
            disabled={isSavingSalaryConfig}
          />

          {configSalaryModel === 'MONTHLY' ? (
            <Input 
              label="Basic Salary (₹)" 
              type="number"
              placeholder="e.g. 18000"
              value={configBasicSalary}
              onChange={(e) => setConfigBasicSalary(e.target.value)}
              disabled={isSavingSalaryConfig}
            />
          ) : (
            <Input 
              label="Per Day Rate (₹)" 
              type="number"
              placeholder="e.g. 700"
              value={configPerDayRate}
              onChange={(e) => setConfigPerDayRate(e.target.value)}
              disabled={isSavingSalaryConfig}
            />
          )}

          <Input 
            label="Overtime Rate (₹ / hr)" 
            type="number"
            placeholder="e.g. 120"
            value={configOvertimeRate}
            onChange={(e) => setConfigOvertimeRate(e.target.value)}
            disabled={isSavingSalaryConfig}
          />

          <Input 
            label="Default Allowances (₹)" 
            type="number"
            placeholder="e.g. 1500"
            value={configAllowancesDefault}
            onChange={(e) => setConfigAllowancesDefault(e.target.value)}
            disabled={isSavingSalaryConfig}
          />

          <Input 
            label="Default Deductions (₹)" 
            type="number"
            placeholder="e.g. 300"
            value={configDeductionsDefault}
            onChange={(e) => setConfigDeductionsDefault(e.target.value)}
            disabled={isSavingSalaryConfig}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button 
              variant="secondary" 
              onClick={() => setSalaryConfigModalOpen(false)} 
              disabled={isSavingSalaryConfig}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveSalaryConfig} 
              disabled={isSavingSalaryConfig}
            >
              {isSavingSalaryConfig ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OutletView;
