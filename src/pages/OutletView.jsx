import SalesEntryReview from '../components/SalesEntryReview';
import {salesEnterKey,salesIssueTarget} from '../utils/salesKeyboard';
import {salesDraftKey,readSalesDraft,writeSalesDraft,saleErrorDetails,uncertainSale,saleSubmissionIssues} from '../utils/salesDraft';
import StallCustomerDispatch from './StallCustomerDispatch';
import StockMovementReport from './StockMovementReport';
import StallStockIn from './StallStockIn';
import OwnSalesRecords from './OwnSalesRecords';
import PaymentBreakdown from '../components/PaymentBreakdown';
import PaymentSplitInput from '../components/PaymentSplitInput';
import {splitPayments} from '../utils/paymentSplits';
import {requiredShowroomFields} from '../utils/showroomPricing';
import OrderGroupTree from '../components/OrderGroupTree';
import {useSearchParams} from 'react-router-dom';
import {saleProductName} from '../utils/saleProductName';
import SalesBill from '../components/SalesBill';
import InvoiceSalesReport from '../components/InvoiceSalesReport';
import {reportInvoices} from '../utils/reportInvoices';
import {outletAvailableStock} from '../utils/salesStock';
import GroupedStockTable from '../components/GroupedStockTable';
import AfterSales from './AfterSales';
import ProductMrp from '../components/ProductMrp';
import {businessDate} from '../utils/businessDate';
import GodownReports from '../components/GodownReports';
import GodownCustody from '../components/GodownCustody';
import DispatchPlans from './DispatchPlans';
import DispatchSources from '../components/DispatchSources';
import GodownQuantityStock from '../components/GodownQuantityStock';
import GroupedProductPicker from '../components/GroupedProductPicker';
import {showroomItemForProduct} from '../utils/showroomPricing';
import {productionOption,groupedProductOptions} from '../utils/productHierarchy';
import { missingSaleFields } from '../utils/salesValidation';
import { complimentaryForProduct } from '../utils/orderComplimentary';
import OrderProduct from '../components/OrderProduct';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/axios';
import { Calendar, FileText, Gift, MapPin, PackageSearch, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { createOrder, fetchOutletOrders, fetchOutletStock, fetchOutletProductNames, receiveOrder, recordSales, fetchDueCustomers, settleDuePayment, downloadSalesReport, fetchReportData } from '../api/orders';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchOutletEmployees, createOutletEmployee, updateEmployeeSalary } from '../api/employees';
import { getOutletLocation, updateOutletLocation } from '../api/location';
import { fetchActiveOutletOffers } from '../api/offers';

import { AuthContext } from '../context/AuthContext';
import EmployeeAttendance from './EmployeeAttendance';
import ShowroomSaleFields from '../components/ShowroomSaleFields';
import { showroomPrice, showroomBillPrice, emptyShowroomItem,discountAmountText } from '../utils/showroomPricing';
import './OutletView.css';

const OutletView = () => {
  const { outletId, role, empName: loggedInEmployeeName } = React.useContext(AuthContext);
  const [moduleParams]=useSearchParams();
  const requestedModule=moduleParams.get('module');
  const [isGodown, setIsGodown] = useState(null);
  const [godownStockView, setGodownStockView] = useState('CURRENT');
  useEffect(() => { let alive = true; api.get('/outlet/workspace').then(data => { if (alive) setIsGodown(data.locationType === 'GODOWN'); }).catch(() => {}); return () => { alive = false; }; }, [outletId]);
  const isStall=role==='STALL';
  const [stallStock,setStallStock]=useState(null);
  useEffect(()=>{if(isStall)api.get('/stall/stock').then(setStallStock).catch(()=>{});},[isStall]);
  const [activeTab, setActiveTab] = useState(() => (
    role==='STALL'?'STOCK_IN':
    ['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR'].includes(role) ? 'ATTENDANCE' : 'CREATE_ORDER'
  ));

  const outletTabs = [
    { id: 'CREATE_ORDER', label: 'Create Order' },
    { id: 'MY_ORDERS', label: 'My Orders' },
    { id: 'STOCK', label: 'Stock View' },
    { id: 'RECEIVE_STOCK', label: 'Receive Stock' },
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
    { id: 'RECEIVE_STOCK', label: 'Receive Stock' },
    { id: 'SALES', label: 'Sales Entry' },
    { id: 'DUE_CUSTOMERS', label: 'Pending Payments' },
    { id: 'REPORTS', label: 'Reports' },
  ];
  const tabs = isStall?[{id:'STOCK_IN',label:'Stock In / Return'},{id:'SALES',label:'Sales Entry'},{id:'CUSTOMER_DISPATCH',label:'Dispatch'},{id:'STOCK',label:'Stock View'},{id:'REPORTS',label:'Reports'}]:(['OUTLET', 'EMPLOYEE', 'CASHIER', 'SUPERVISOR'].includes(role) ? employeeTabs : outletTabs).filter(tab => (tab.id !== 'SALES' || isGodown === false)).concat(isGodown ? [{id:'ASSIGNED_DISPATCH',label:'Dispatch Assigned Orders'},{id:'PRODUCT_IN',label:'Temporary Stocks'},{id:'SALES_OUT',label:'Sales Out'}] : []).filter(tab => tab.id !== 'DUE_CUSTOMERS').concat(!isGodown && String(outletId).toUpperCase().startsWith('NIM')?[{id:'SALES_RECORDS',label:'Sales Records'}]:[]).concat(!isGodown && String(outletId).toUpperCase().startsWith('NIM')?[{id:'CUSTOMER_DISPATCH',label:'Dispatch'}]:[]).concat([{id:'AFTER_SALES',label:'After-sales'}]);

  const availableModuleIds=tabs.map(tab=>tab.id).join(',');
  useEffect(()=>{if(requestedModule && availableModuleIds.split(',').includes(requestedModule))setActiveTab(requestedModule);},[requestedModule,availableModuleIds]);

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
                ...productionOption(p),
                label: name || id || 'Unknown Product',
                value: id || name,
                groupId: p.group_id || p.groupId,
                group: p.groupPath || p.group_name || p.groupName || 'Ungrouped'
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
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customized, setCustomized] = useState(false);
  const [customSize, setCustomSize] = useState({ length: '', width: '', thickness: '', unit: 'inches' });
  const customSizeText = (size) => size ? `${size.length} × ${size.width}${size.thickness ? ` × ${size.thickness}` : ''} ${size.unit}` : '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const productGroups = useMemo(() => (
    groupedProductOptions(productOptions).flatMap(main=>main.groups.map(group=>({...group,mainGroupName:main.name})))
  ), [productOptions]);

  const matchingGroupCategories = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    return groupedProductOptions(productOptions)
      .map(main => ({...main, groups: main.groups.filter(group =>
        `${main.name} ${group.label}`.toLowerCase().includes(query))}))
      .filter(main => main.groups.length > 0);
  }, [productOptions, groupSearch]);

  // An outlet may only order from groups assigned to it by the manager. Keep a
  // concrete group selected, rather than offering an "all products" view that
  // can make the outlet's permitted catalogue look unrestricted.
  useEffect(() => {
    if (!productGroups.length) {
      setSelectedProductGroup('');
      setSelectedProduct('');
      return;
    }
    if (!productGroups.some(group=>group.id===selectedProductGroup)) {
      setSelectedProductGroup(productGroups[0].id);
      setSelectedProduct('');
    }
  }, [productGroups, selectedProductGroup]);

  const visibleProductOptions = useMemo(() => {
    const placeholder = productOptions.find(option => !option.value) || { label: 'Select a product...', value: '' };
    const products = productOptions.filter(option => option.value);
    return [
      placeholder,
      ...products.filter(option => (option.groupId || option.group) === selectedProductGroup)
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
  const [receiptTarget, setReceiptTarget] = useState(null);
  const [receiptQuantities, setReceiptQuantities] = useState({});
  const [receiptError, setReceiptError] = useState(null);
  const [receiptNotice, setReceiptNotice] = useState(null);
  const [receivingStock, setReceivingStock] = useState(false);

  // --- Stock View State ---
  const [stockItems, setStockItems] = useState([]);
  const [stockDay,setStockDay]=useState(businessDate);
  useEffect(()=>{
    const updateDay=()=>setStockDay(businessDate());
    const timer=setInterval(updateDay,60000);
    window.addEventListener('focus',updateDay);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',updateDay);};
  },[]);
  const [stockReload, setStockReload] = useState(0);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);

  // --- Sales Entry State ---
  const draftKey=salesDraftKey(sessionStorage.getItem('username'),outletId);
  const [savedSalesDraft]=useState(()=>readSalesDraft(localStorage,draftKey));
  const draft=savedSalesDraft?.form || {};
  const [pendingSale,setPendingSale]=useState(savedSalesDraft?.pending || null);
  const pendingSaleRef=useRef(savedSalesDraft?.pending || null);
  const salesSubmitLock=useRef(false);
  const [draftStorageError,setDraftStorageError]=useState(false);
  const [draftRecovered,setDraftRecovered]=useState(Boolean(savedSalesDraft));

  const [salesCatalogueStatus,setSalesCatalogueStatus]=useState('loading');
  const [salesProductOptions, setSalesProductOptions] = useState([{ label: 'Loading products...', value: '' }]);
  const [ownedShowroomSales, setOwnedShowroomSales] = useState(() => String(outletId || '').toUpperCase().startsWith('NIM'));
  const [salesItems, setSalesItems] = useState(draft.salesItems ?? []);
  const [editingSalesIndex,setEditingSalesIndex]=useState(draft.editingSalesIndex ?? null);
  const [salesEntryStep,setSalesEntryStep] = useState(draft.salesEntryStep ?? 0);
  const salesStepTop=useRef(null);
  const goToSalesStep=step=>{setSalesEntryStep(step);requestAnimationFrame(()=>salesStepTop.current?.scrollIntoView({behavior:'smooth',block:'start'}));};
  const salesProductSelector = useRef(null);
  const salesFormRef=useRef(null);
  const salesNoticeRef=useRef(null);
  const [salesOutletStock,setSalesOutletStock] = useState([]);
  const [salesStockStatus,setSalesStockStatus] = useState('loading');
  const [salesStockRefresh,setSalesStockRefresh] = useState(0);
  useEffect(()=>{
    if(activeTab !== 'SALES' || !outletId)return;
    let current=true;
    setSalesStockStatus('loading');setSalesOutletStock([]);
    fetchOutletStock(outletId).then(response=>{
      if(!current)return;
      setSalesOutletStock(Array.isArray(response)?response:(response?.products || []));
      setSalesStockStatus('ready');
      if(isStall)api.get('/stall/stock').then(setStallStock).catch(()=>{});
    }).catch(()=>{if(current)setSalesStockStatus('error');});
    return ()=>{current=false;};
  },[activeTab,outletId,salesStockRefresh,isStall]);
  const availableStockLabel = (productId,mode=salesFulfillmentMode) => isStall && mode==='LINKED_OUTLET_STOCK' && !stallStock?'Loading linked outlet stock…':salesStockStatus==='ready' ? outletAvailableStock(isStall && mode==='LINKED_OUTLET_STOCK'?(stallStock?.outletStock || []):salesOutletStock,productId) : salesStockStatus==='loading' ? 'Loading…' : 'Unavailable — refresh stock';

  const [showroomItem, setShowroomItem] = useState(draft.showroomItem ?? { ...emptyShowroomItem });
  const [salesValidationErrors, setSalesValidationErrors] = useState([]);
  const [salesFulfillmentMode, setSalesFulfillmentMode] = useState(draft.salesFulfillmentMode ?? '');
  const [saleDetails, setSaleDetails] = useState(draft.saleDetails ?? { billNo: '', dispatchDate: '' });
  const [salesProduct, setSalesProduct] = useState(draft.salesProduct ?? '');
  const [salesQuantity, setSalesQuantity] = useState(draft.salesQuantity ?? 1);
  const [salesDate, setSalesDate] = useState(draft.salesDate ?? businessDate());
  const [customerName, setCustomerName] = useState(draft.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(draft.customerPhone ?? '');
  const [customerAddress, setCustomerAddress] = useState(draft.customerAddress ?? '');
  const [paymentMethod, setPaymentMethod] = useState(draft.paymentMethod ?? '');
  const [advanceSplit,setAdvanceSplit]=useState(draft.advanceSplit ?? {});
  const [settlementSplit,setSettlementSplit]=useState({});
  const [billAmount, setBillAmount] = useState(draft.billAmount ?? '');
  const [advanceAmount, setAdvanceAmount] = useState(draft.advanceAmount ?? '');
  const [cashDiscount, setCashDiscount] = useState(draft.cashDiscount ?? '');
  const [extraDiscountType, setExtraDiscountType] = useState(draft.extraDiscountType ?? 'PERCENT');
  const [extraDiscountValue, setExtraDiscountValue] = useState(draft.extraDiscountValue ?? '');
  const [extraDiscountReason, setExtraDiscountReason] = useState(draft.extraDiscountReason ?? '');
  const [isSubmittingSales, setIsSubmittingSales] = useState(false);
  const [salesError, setSalesError] = useState(null);
  const [salesSuccess, setSalesSuccess] = useState(null);
  const [dueCustomers, setDueCustomers] = useState([]);
  const [dueCustomersLoading, setDueCustomersLoading] = useState(false);
  const [dueCustomersError, setDueCustomersError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('');
  const [settlementError, setSettlementError] = useState('');
  const [settlingPayment, setSettlingPayment] = useState(false);

  const salesDraftForm={salesItems,editingSalesIndex,salesEntryStep,showroomItem,salesFulfillmentMode,saleDetails,salesProduct,salesQuantity,salesDate,customerName,customerPhone,customerAddress,paymentMethod,advanceSplit,billAmount,advanceAmount,cashDiscount,extraDiscountType,extraDiscountValue,extraDiscountReason};
  const draftFormJson=JSON.stringify(salesDraftForm);
  useEffect(()=>{
    const form=JSON.parse(draftFormJson);
    if(form.salesItems.length || form.salesProduct || form.customerName || form.advanceAmount || pendingSale){
      setDraftStorageError(!writeSalesDraft(localStorage,draftKey,form,pendingSale));
    } else { try {localStorage.removeItem(draftKey);} catch {setDraftStorageError(true);} }
  },[draftKey,draftFormJson,pendingSale]);
  useEffect(()=>{
    const warn=event=>{if(salesSubmitLock.current){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);
  },[]);

  const grossAmount = ownedShowroomSales ? salesItems.reduce((total, item) => total + Math.round((showroomPrice(item)?.totalSalesValue || 0) * 100), 0) / 100 : Number(billAmount || 0);
  const enteredDiscount = ownedShowroomSales ? Number(cashDiscount || 0) : Number(extraDiscountValue || 0);
  const calculatedExtraDiscount = !ownedShowroomSales && extraDiscountType === 'PERCENT'
    ? grossAmount * enteredDiscount / 100
    : enteredDiscount;
  const netBillAmount = ownedShowroomSales ? (showroomBillPrice(grossAmount.toFixed(2), cashDiscount)?.netBillAmount ?? 0) : Math.max(0, grossAmount - calculatedExtraDiscount);

  const handleAddSalesItem = () => {
    if (!salesProduct) {
      setSalesValidationErrors(['Product']);
      return;
    }
    if (!Number.isSafeInteger(Number(salesQuantity)) || Number(salesQuantity) <= 0) {
      setSalesValidationErrors(['Quantity must be greater than zero']);
      return;
    }
    if (ownedShowroomSales && (!requiredShowroomFields(salesProductOptions.find(option=>option.value===salesProduct)).every(key => showroomItem[key].trim()) || !showroomPrice({ ...showroomItem, quantity: Number(salesQuantity) })?.value)) {
      const fields = requiredShowroomFields(salesProductOptions.find(option=>option.value===salesProduct)).filter(key => !showroomItem[key].trim()).map(key => ({brand:'Brand',model:'Model',colour:'Colour',size:'Size'})[key]);
      if (!showroomItem.mrpSticker || Number(showroomItem.mrpSticker) <= 0) fields.push('Sticker MRP');
      if (!showroomPrice({...showroomItem,quantity:Number(salesQuantity)})) fields.push('Discount amount must be zero or more and less than the sticker MRP');
      if (showroomItem.taxPercent === '' || Number(showroomItem.taxPercent) < 0 || Number(showroomItem.taxPercent) > 100) fields.push('Tax percentage');
      setSalesValidationErrors(fields.length ? fields : ['Valid product pricing and quantity']);
      return;
    }
    if (ownedShowroomSales && !salesFulfillmentMode) {setSalesValidationErrors(['Delivery source for this product']);return;}
    const existingIndex = salesItems.findIndex(i => i.product_id === salesProduct && (!ownedShowroomSales || i.fulfillmentMode === salesFulfillmentMode) && (!ownedShowroomSales || Object.keys(emptyShowroomItem).every(key => i[key] === showroomItem[key])));
    if(editingSalesIndex!==null){
      setSalesItems(current=>current.map((item,index)=>index===editingSalesIndex?{product_id:salesProduct,quantity:Number(salesQuantity),...(ownedShowroomSales?{...showroomItem,fulfillmentMode:salesFulfillmentMode}:{})}:item));
    } else if (existingIndex >= 0) {
      const newItems = [...salesItems];
      newItems[existingIndex].quantity += Number(salesQuantity);
      setSalesItems(newItems);
    } else {
      setSalesItems([...salesItems, { product_id: salesProduct, quantity: Number(salesQuantity), ...(ownedShowroomSales ? {...showroomItem,fulfillmentMode:salesFulfillmentMode} : {}) }]);
    }
    setEditingSalesIndex(null);
    setSalesProduct('');
    setSalesFulfillmentMode('');
    setShowroomItem({ ...emptyShowroomItem });
    setSalesQuantity(1);
    setSalesError(null);
    setSalesSuccess(`${editingSalesIndex!==null?'Updated':'Added'} product. ${salesItems.length+(editingSalesIndex!==null || existingIndex>=0?0:1)} product lines in this bill.`);
    setSalesValidationErrors([]);
    if(editingSalesIndex!==null && ownedShowroomSales){goToSalesStep(3);return;}
    requestAnimationFrame(()=>{salesProductSelector.current?.querySelector('[aria-haspopup="listbox"]')?.focus({preventScroll:true});salesProductSelector.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  };

  useEffect(() => {
    if (!['SALES', 'CREATE_ORDER'].includes(activeTab)) return;
    fetchActiveOutletOffers().then((response) => setActiveOffers(response?.offers || [])).catch(() => setActiveOffers([]));
  }, [activeTab]);

  const cancelSalesEdit=()=>{
    setEditingSalesIndex(null);setSalesProduct('');setSalesQuantity(1);setSalesFulfillmentMode('');setShowroomItem({...emptyShowroomItem});if(ownedShowroomSales)goToSalesStep(3);
  };
  const editSalesItem=index=>{
    const item=salesItems[index];
    setEditingSalesIndex(index);setSalesProduct(item.product_id);setSalesQuantity(item.quantity);setSalesFulfillmentMode(item.fulfillmentMode || '');
    setShowroomItem(Object.fromEntries(Object.entries(emptyShowroomItem).map(([key,value])=>[key,key==='discountAmount'?discountAmountText(item):String(item[key] ?? value)])));
    setSalesError(null);setSalesSuccess(null);goToSalesStep(0);
    requestAnimationFrame(()=>salesProductSelector.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  };
  const removeSalesItem = (idxToRemove) => {
    setSalesItems(salesItems.filter((_, idx) => idx !== idxToRemove));
    setSalesError(null);
  };

  const salesFieldError=id=>salesValidationErrors.find(message=>salesIssueTarget(message).id===id);
  const focusSalesIssue=message=>{
    const target=salesIssueTarget(message);setSalesEntryStep(target.step);
    requestAnimationFrame(()=>{
      const field=target.id?document.getElementById(target.id):salesProductSelector.current?.querySelector('[aria-haspopup="listbox"]');
      field?.focus({preventScroll:true});field?.scrollIntoView({block:'center',behavior:'smooth'});
    });
  };
  const navigateSalesStep=next=>{
    if(next<=salesEntryStep){goToSalesStep(next);return;}
    const issues=[];
    if(editingSalesIndex!==null)issues.push('Update the product being edited, or cancel the edit.');
    if(!salesItems.length)issues.push('Add at least one product to the bill.');
    if(salesProduct && editingSalesIndex===null)issues.push('Add the selected product to the bill before continuing.');
    if(next>1){
      if(!salesDate)issues.push('Date of sale is required.');
      if(!saleDetails.dispatchDate)issues.push('Dispatch date is required.');
      issues.push(...saleSubmissionIssues(salesDraftForm,true));
      if(paymentMethod==='SPLIT' && (!splitPayments(advanceSplit)?.payments.length || splitPayments(advanceSplit).total!==Number(advanceAmount)))issues.push('Split payment amounts must equal the amount received.');
      if(!Number.isFinite(Number(advanceAmount)) || Number(advanceAmount)<0 || Number(advanceAmount)>netBillAmount)issues.push('Amount received must be between zero and the bill total.');
      if(!showroomBillPrice(grossAmount.toFixed(2),cashDiscount))issues.push('Cash discount must be valid and less than the bill amount.');
    }
    if(next>2){
      if(!customerName.trim())issues.push('Customer name is required.');
      if(!customerPhone.trim())issues.push('Customer phone number is required.');
      if(!customerAddress.trim())issues.push('Customer address is required.');
    }
    if(issues.length){setSalesValidationErrors(issues);return;}
    setSalesValidationErrors([]);setSalesSuccess(null);goToSalesStep(next);
    requestAnimationFrame(()=>{visibleStepFirst()?.focus({preventScroll:true});});
  };
  const visibleStepFirst=()=>[...(salesFormRef.current?.querySelectorAll('section:not([hidden]) input,section:not([hidden]) select,section:not([hidden]) button') || [])].find(field=>!field.disabled && field.getClientRects().length);
  const previousSalesIssueCount=useRef(0);
  useEffect(()=>{
    if(salesValidationErrors.length>previousSalesIssueCount.current)salesNoticeRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'});
    previousSalesIssueCount.current=salesValidationErrors.length;
  },[salesValidationErrors]);
  const salesKeyboard=event=>{
    if(event.key==='Enter' && !event.nativeEvent?.isComposing && ['INPUT','SELECT'].includes(event.target.tagName) && !event.target.closest('[data-searchable-select]') && !event.target.checkValidity()){
      event.preventDefault();const label=event.target.closest('.input-group')?.querySelector('label')?.textContent || 'This field';
      setSalesValidationErrors([`${label}: ${event.target.validationMessage}`]);return;
    }
    salesEnterKey(event);
  };

  const handleRecordSalesSubmit = async () => {
    if(salesSubmitLock.current)return;
    const retry=pendingSaleRef.current;
    if(!retry && salesCatalogueStatus!=='ready'){setSalesError('Product details are unavailable. Refresh products before submitting; your draft is preserved.');return;}
    if(!retry && editingSalesIndex!==null){setSalesValidationErrors(['Update the product being edited, or cancel the edit.']);return;}
    const missing = missingSaleFields({items:salesItems, customerName, customerPhone, customerAddress, salesDate,
      ownedShowroom:ownedShowroomSales, dispatchDate:saleDetails.dispatchDate, fulfillmentMode:salesFulfillmentMode});
    if(!retry)missing.push(...saleSubmissionIssues(salesDraftForm,ownedShowroomSales));
    if (!retry && missing.length) { setSalesValidationErrors(missing); return; }
    const parsedBillAmount = grossAmount;
    const parsedAdvanceAmount = Number(advanceAmount || 0);
    if(!retry && paymentMethod==='SPLIT' && (!splitPayments(advanceSplit)?.payments.length || splitPayments(advanceSplit).total!==parsedAdvanceAmount)){setSalesError('Enter valid split amounts equal to the advance received.');return;}
    if (!retry && ownedShowroomSales && (!Number.isFinite(parsedBillAmount) || parsedBillAmount <= 0 || !Number.isFinite(enteredDiscount) || enteredDiscount < 0 || calculatedExtraDiscount >= parsedBillAmount || !Number.isFinite(parsedAdvanceAmount) || parsedAdvanceAmount < 0 || parsedAdvanceAmount > netBillAmount)) {
      const errors = [];
      if (!Number.isFinite(parsedBillAmount) || parsedBillAmount <= 0) errors.push('Bill amount must be greater than zero');
      if (!Number.isFinite(enteredDiscount) || enteredDiscount < 0 || calculatedExtraDiscount >= parsedBillAmount || (!ownedShowroomSales && extraDiscountType === 'PERCENT' && enteredDiscount > 100)) errors.push('Discount must be valid and less than the bill amount');
      if (!Number.isFinite(parsedAdvanceAmount) || parsedAdvanceAmount < 0 || parsedAdvanceAmount > netBillAmount) errors.push('Amount paid now cannot exceed the final bill amount');
      setSalesValidationErrors(errors);
      return;
    }
    salesSubmitLock.current=true;
    setIsSubmittingSales(true);
    setSalesError(null);
    setSalesSuccess(null);

    try {
      const submittedItems = salesItems.map((item) => ({ ...item, productName: saleProductName(getProductName(item.product_id),item.size) }));
      const payload = retry || {
        requestId: crypto.randomUUID(),
        outletId: outletId,
        date: salesDate,
        ...(ownedShowroomSales ? {
          customerName: customerName.trim(), customerPhone: customerPhone.trim(), customerAddress: customerAddress.trim(),
          paymentMethod, ...(paymentMethod==='SPLIT'?{payments:splitPayments(advanceSplit)?.payments || []}:{}), billAmount: parsedBillAmount, pricingMode: 'MRP_DISCOUNT',
          ...saleDetails, dispatchDate: saleDetails.dispatchDate || null, advanceAmount: parsedAdvanceAmount,
          extraDiscountType, cashDiscount: cashDiscount || '0', extraDiscountValue: 0, extraDiscountReason: extraDiscountReason.trim(),
        } : {entryMode: 'QUANTITY_ONLY'}),
        soldItems: salesItems.map(({ quantity, ...item }) => ({ ...item, ...(ownedShowroomSales?{discountPercent:String(item.discountAmount ?? '').trim()!==''?showroomPrice({...item,quantity})?.discountPercent:item.discountPercent,...(String(item.discountAmount ?? '').trim()===''?{discountAmount:undefined}:{})}:{}), qty: quantity }))
      };
      // Save the exact request before sending; an uncertain retry must use it unchanged.
      if(!writeSalesDraft(localStorage,draftKey,salesDraftForm,payload)) {
        setDraftStorageError(true);
        throw new Error('Unable to save the recovery draft on this device. Free browser storage and retry before submitting.');
      }
      pendingSaleRef.current=payload;setPendingSale(payload);
      const result=await recordSales(payload);
      pendingSaleRef.current=null;setPendingSale(null);setDraftRecovered(false);
      if (ownedShowroomSales) setReceipt({ ...result, items: submittedItems.map((item, index) => ({ ...item, ...(result.soldItems?.[index] || {}) })) });
      setSalesSuccess(ownedShowroomSales ? 'Sales invoice created successfully.' : 'Products recorded successfully and outlet stock updated.');
      setSalesItems([]);
      setSalesEntryStep(0);
      setSalesStockRefresh(value=>value+1);
      setSaleDetails({ billNo: '', dispatchDate: '' });
      setSalesFulfillmentMode('');
      setShowroomItem({ ...emptyShowroomItem });
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setPaymentMethod('');
      setBillAmount('');
      setAdvanceAmount('');setAdvanceSplit({});setPaymentMethod('');
      setExtraDiscountType('PERCENT');
      setExtraDiscountValue('');
      setCashDiscount('');
      setExtraDiscountReason('');
    } catch (err) {
      const unknown=Boolean(pendingSaleRef.current) && uncertainSale(err);
      if(!unknown){pendingSaleRef.current=null;setPendingSale(null);writeSalesDraft(localStorage,draftKey,salesDraftForm,null);}
      const details=saleErrorDetails(err.response?.data);
      const diagnosticId=err.response?.headers?.['x-sales-diagnostic-id'];
      if(diagnosticId)details.push(`Support reference: ${diagnosticId}`);
      setSalesError(unknown?'Save confirmation was interrupted. Your bill is preserved. Retry this same submission to confirm it safely; do not enter it again as a new sale.':`Sale was not submitted. ${details.join(' ') || err.message || 'Please correct the details and retry.'}`);
      setSalesValidationErrors(unknown?[]:details);
      if([400,409].includes(err.response?.status))setSalesStockRefresh(value=>value+1);
    } finally {
      salesSubmitLock.current=false;
      setIsSubmittingSales(false);
    }
  };

  const openSettlement = (invoice) => {
    const target={...invoice,balanceDue:invoice.balanceDue ?? invoice.pendingAmount,saleReferenceId:invoice.saleReferenceId || invoice.saleId};
    setShowReportPending(false);setPaymentTarget(target); setSettlementAmount(String(target.balanceDue || '')); setSettlementMethod(''); setSettlementSplit({}); setSettlementError('');
  };
  const confirmSettlement = async () => {
    if (!['CASH','UPI','CARD','SPLIT'].includes(settlementMethod)) {setSettlementError('Choose Cash, UPI, or Card for this payment.');return;}
    const paidAmount = Number(settlementAmount);
    if(settlementMethod==='SPLIT' && (!splitPayments(settlementSplit)?.payments.length || splitPayments(settlementSplit).total!==paidAmount)){setSettlementError('Enter valid split amounts equal to the payment received.');return;}
    if (!paymentTarget || !Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount > Number(paymentTarget.balanceDue || 0)) {
      setSettlementError('Enter an amount up to the balance due.'); return;
    }
    setSettlingPayment(true); setSettlementError('');
    try {
      const result = await settleDuePayment(paymentTarget.saleReferenceId, { outletId, paymentMethod: settlementMethod, paidAmount, ...(settlementMethod==='SPLIT'?{payments:splitPayments(settlementSplit).payments}:{}) });
      setReceipt(result); setPaymentTarget(null);
      const response = await fetchDueCustomers(outletId); setDueCustomers(response?.customers || []);
      if (activeTab==='REPORTS') await handleGenerateReport();
    } catch (error) {
      setSettlementError(error.response?.data?.error || 'Unable to record the payment.');
    } finally { setSettlingPayment(false); }
  };

  // --- Reports State ---
  const [reportView, setReportView] = useState('list'); // 'list', 'daily', 'weekly', 'monthly'
  const [reportDate, setReportDate] = useState(businessDate());
  const [reportData, setReportData] = useState(null);
  const [reportPaymentMethod,setReportPaymentMethod] = useState('ALL');
  const [showReportPending,setShowReportPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const handleGenerateReport = async (method = reportPaymentMethod) => {
    setIsGenerating(true);
    setReportError(null);
    try {
      const data = await fetchReportData(reportView, reportDate, outletId, method);
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
      await downloadSalesReport(reportView, reportDate, outletId, reportPaymentMethod);
    } catch (err) {
      setReportError(err.response?.data?.message || err.message || 'Failed to download report.');
    } finally {
      setIsDownloading(false);
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
  const emptyBank = {salaryPaymentMethod:'BANK', bankAccountNumber:'', ifscCode:'', bankName:'', bankBranch:''};
  const [empBank, setEmpBank] = useState(emptyBank);
  const [configBank, setConfigBank] = useState(emptyBank);
  const [empMonthlyEsiPfAmount, setEmpMonthlyEsiPfAmount] = useState('0');
  const [configMonthlyEsiPfAmount, setConfigMonthlyEsiPfAmount] = useState('0');
  const [empMonthlyTravelAllowance, setEmpMonthlyTravelAllowance] = useState('0');
  const [configMonthlyTravelAllowance, setConfigMonthlyTravelAllowance] = useState('0');
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
      ...empBank,
      monthlyEsiPfAmount: empMonthlyEsiPfAmount || '0',
      monthlyTravelAllowance: empMonthlyTravelAllowance || '0',
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
      setEmpMonthlyTravelAllowance('0');
      setEmpMonthlyEsiPfAmount('0');
      setEmpBank(emptyBank);
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
    setConfigBank({...Object.fromEntries(['bankAccountNumber','ifscCode','bankName','bankBranch'].map(field => [field, sal[field] || ''])),salaryPaymentMethod:sal.salaryPaymentMethod || 'BANK'});
    setConfigSalaryModel(sal.salaryModel || 'MONTHLY');
    setConfigMonthlyEsiPfAmount(String(sal.monthlyEsiPfAmount || 0));
    setConfigMonthlyTravelAllowance(String(sal.monthlyTravelAllowance || 0));
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
      ...configBank,
      monthlyEsiPfAmount: configMonthlyEsiPfAmount || '0',
      monthlyTravelAllowance: configMonthlyTravelAllowance || '0',
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
    
    if (['MY_ORDERS', 'RECEIVE_STOCK'].includes(activeTab) && outletId) {
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
    } else if (activeTab === 'STOCK' && outletId && isGodown !== null) {
      setStockLoading(true);
      setStockError(null);
      
      (isGodown ? api.get('/godown/quantity-stock').then(data => ({products:data.stock})) : fetchOutletStock(outletId)).then(response => {
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
      setSalesCatalogueStatus('loading');
      fetchOutletProductNames(outletId).then(response => {
        if (isMounted) {
          const list = Array.isArray(response) ? response : (response?.products || []);
          setOwnedShowroomSales(response?.ownedShowroom ?? String(outletId).toUpperCase().startsWith('NIM'));
          setSalesCatalogueStatus('ready');
          const options = [
             { label: 'Select a product...', value: '' },
             ...list.map(p => ({
               ...productionOption(p),
               mrpSticker: p.mrpSticker ?? null,
               label: p.name || p.product_name || p.productName || p.title || String(p.id || p.product_id),
               value: String(p.id || p.product_id)
             }))
          ];
          setSalesProductOptions(options);
        }
      }).catch(() => {
        if (isMounted) {
           setSalesCatalogueStatus('error');
           setSalesProductOptions([{ label: 'Error loading options', value: '' }]);
        }
      });
    } else if (activeTab === 'DUE_CUSTOMERS' && isGodown === false && outletId) {
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
  }, [activeTab, outletId, productNameById, isGodown, stockReload,stockDay]);

  const openManualReceipt = (order) => {
    setReceiptTarget(order);
    setReceiptQuantities(Object.fromEntries((order.receiptItems || []).map((item) => [item.product_id, ''])));
    setReceiptError(null);
    setReceiptNotice(null);
  };

  const submitManualReceipt = async () => {
    if (!receiptTarget) return;
    const receivedItems = (receiptTarget.receiptItems || []).flatMap((item) => {
      const rawQuantity = receiptQuantities[item.product_id];
      if (rawQuantity === '' || rawQuantity === undefined || rawQuantity === null) return [];
      const qty = Number(rawQuantity);
      return Number.isInteger(qty) && qty > 0 ? [{ product_id: item.product_id, qty }] : [];
    });
    if (!receivedItems.length) {
      setReceiptError('Enter a received quantity for at least one product. Leave products not received yet blank.');
      return;
    }
    const invalidItem = receivedItems.find((received) => {
      const expected = (receiptTarget.receiptItems || []).find((item) => item.product_id === received.product_id);
      return received.qty > Number(expected?.remainingQty || 0);
    });
    if (invalidItem) {
      setReceiptError('A received quantity cannot be more than the pending quantity.');
      return;
    }
    setReceivingStock(true);
    setReceiptError(null);
    try {
      const result = await receiveOrder(receiptTarget.loadPlanId, {
        orderId: receiptTarget.orderId,
        outletId,
        receivedItems,
      });
      setReceiptTarget(null);
      setReceiptNotice(result?.isReceived
        ? 'All products were received and added to Stock View.'
        : 'Received quantities were added to Stock View. The remaining products stay pending.');
      const response = await fetchOutletOrders(outletId);
      setMyOrders(Array.isArray(response) ? response : (response?.orders || []));
    } catch (err) {
      setReceiptError(err.response?.data?.error || err.response?.data?.message || 'Unable to save the received quantities.');
    } finally {
      setReceivingStock(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setApiError('Please select a product.');
      return;
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      setApiError('Quantity must be a positive whole number.');
      return;
    }
    let size;
    if (customized) {
      const validDimension = (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 99999.99 && Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.000001;
      if (!validDimension(customSize.length) || !validDimension(customSize.width) || (customSize.thickness !== '' && !validDimension(customSize.thickness))) {
        setApiError('Enter positive length and width, and optional thickness, using at most two decimal places.');
        return;
      }
      size = { length: Number(customSize.length), width: Number(customSize.width), unit: customSize.unit,
        ...(customSize.thickness !== '' ? { thickness: Number(customSize.thickness) } : {}) };
    }
    const existingIndex = items.findIndex(item => item.product_id === selectedProduct && JSON.stringify(item.customSize) === JSON.stringify(size));
    if (existingIndex >= 0) {
      setItems(items.map((item, index) => index === existingIndex ? { ...item, quantity: item.quantity + Number(quantity) } : item));
    } else {
      setItems([...items, { product_id: selectedProduct, quantity: Number(quantity), ...(size ? { customSize: size } : {}) }]);
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
      setCustomized(false);
      setCustomSize({ length: '', width: '', thickness: '', unit: 'inches' });
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="outlet-current-module"><strong>{tabs.find(tab=>tab.id===activeTab)?.label || 'Outlet Operations'}</strong><small>Switch using the ☰ Modules menu</small></div>

      <div>
        {activeTab === 'CUSTOMER_DISPATCH' && <StallCustomerDispatch/>}
        {activeTab === 'SALES_RECORDS' && <OwnSalesRecords outletId={outletId}/>}
        {activeTab === 'AFTER_SALES' && <AfterSales godownMode={Boolean(isGodown)} />}
        {activeTab === 'ASSIGNED_DISPATCH' && isGodown && <DispatchPlans godownMode />}
        {activeTab === 'PRODUCT_IN' && isGodown && <GodownCustody />}
        {activeTab === 'SALES_OUT' && isGodown && <GodownQuantityStock key="out" direction="OUT" />}
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
                  <Input label="Search production groups" type="search" value={groupSearch} onChange={event=>setGroupSearch(event.target.value)} placeholder="Search group or subgroup name…" />
                  <div className="order-builder-categories">
                    <OrderGroupTree categories={matchingGroupCategories} selectedId={selectedProductGroup} search={groupSearch} onSelect={id=>{setSelectedProductGroup(id);setSelectedProduct('');}} />
                  </div>
                  {!matchingGroupCategories.length && <p role="status">No production groups match your search.</p>}
                </section>
                <section className="order-builder-selection">
                  <div className="order-builder-section-label"><span>2</span><div><strong>Product and quantity</strong><small>{selectedProductGroup ? `${productGroups.find(group=>group.id===selectedProductGroup)?.label || ''} products only` : 'Select a production group'}</small></div></div>
                  <SearchableSelect label="Select product" options={visibleProductOptions} value={selectedProduct} onChange={(val) => setSelectedProduct(val)} placeholder={selectedProductGroup ? `Select a ${productGroups.find(group=>group.id===selectedProductGroup)?.label || ''} product...` : 'Select a production group first'} />
                  <Select label="Size option" value={customized ? 'CUSTOM' : 'STANDARD'} onChange={(event) => setCustomized(event.target.value === 'CUSTOM')} options={[{ value: 'STANDARD', label: 'Standard product size' }, { value: 'CUSTOM', label: 'Customized size' }]} />
                  {customized && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                    <Input label="Length" type="number" min="0.01" step="0.01" value={customSize.length} onChange={(event) => setCustomSize({ ...customSize, length: event.target.value })} />
                    <Input label="Width" type="number" min="0.01" step="0.01" value={customSize.width} onChange={(event) => setCustomSize({ ...customSize, width: event.target.value })} />
                    <Input label="Thickness (optional)" type="number" min="0.01" step="0.01" value={customSize.thickness} onChange={(event) => setCustomSize({ ...customSize, thickness: event.target.value })} />
                    <Select label="Unit" value={customSize.unit} onChange={(event) => setCustomSize({ ...customSize, unit: event.target.value })} options={[{ value: 'inches', label: 'Inches' }, { value: 'cm', label: 'Centimetres' }]} />
                  </div>}
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
                        <span className="order-builder-item-name">{getProductName(item.product_id)}<ProductMrp item={item}/>{item.customSize && <small style={{ display: 'block' }}>Customized: {customSizeText(item.customSize)}</small>}
                          {complimentaryForProduct(activeOffers, item.product_id, productOptions.find(product => product.value === item.product_id)?.groupId).map(offer => <small key={offer.offerId} style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-primary)' }}>Complimentary: {offer.freeProductName || offer.freeProductId} × {offer.freeQuantity}</small>)}
                        </span>
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
              <p className="text-muted" style={{ margin: '1rem 1rem 0' }}>Use <strong>Receive Stock</strong> to enter the quantities that arrived. Products left blank remain pending for the next delivery.</p>
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
                    { key: 'orderId', label: 'Order ID', render: (row) => row.displayId || row.orderId },
                    { key: 'createdBy', label: 'Created by', render: (row) => row.createdByName || (row.createdBy ? 'Name unavailable' : 'Not recorded') },
                    { key: 'isCustomized', label: 'Order type', render: (row) => row.isCustomized ? 'Customized' : 'Standard' },
                    { key: 'createdAt', label: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
                    { key: 'items', label: 'Items Count', align: 'center', render: (row) => row.items?.length || 0 },
                    { key: 'status', label: 'Status', render: (row) => <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}><Badge status={row.status} />{row.approvalStatus === 'PARTIALLY_APPROVED' && row.status !== row.approvalStatus && <Badge status={row.approvalStatus} />}</div> },
                    { key: 'actions', label: 'Actions', render: (row) => (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="secondary" onClick={() => setViewOrderTarget(row)}>View</Button>
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
                <span><strong>Created by:</strong> {viewOrderTarget.createdByName || (viewOrderTarget.createdBy ? 'Name unavailable' : 'Not recorded')}</span>
                <span><strong>Created:</strong> {viewOrderTarget.createdAt ? new Date(viewOrderTarget.createdAt).toLocaleString() : '-'}</span>
                {viewOrderTarget.remarks && <span><strong>Remarks:</strong> {viewOrderTarget.remarks}</span>}
                {viewOrderTarget.rejectedAt && <span><strong>Rejected:</strong> {new Date(viewOrderTarget.rejectedAt).toLocaleString()}</span>}
              </div>
              <Table
                columns={[
                  { key: 'productName', label: 'Product', render: (item) => <OrderProduct item={item} name={item.productName || getProductName(item.product_id) || item.product_id} /> },
                  { key: 'orderedQty', label: 'Ordered', align: 'center', render: (item) => item.orderedQty ?? item.quantity ?? 0 },
                  { key: 'approvedQty', label: 'Approved', align: 'center', render: (item) => item.approvedQty ?? 0 },
                  { key: 'pendingQty', label: 'Approval pending', align: 'center', render: (item) => item.pendingQty ?? 0 },
                  { key: 'dispatchSources', label: 'Dispatch source', render: (item) => <DispatchSources sources={item.dispatchSources} /> },
                  { key: 'dispatchedQty', label: 'Dispatched', align: 'center', render: (item) => item.dispatchedQty ?? 0 },
                  { key: 'receivedQty', label: 'Received', align: 'center', render: (item) => item.receivedQty ?? 0 },
                ]}
                data={viewOrderTarget.items || []}
                emptyStateMessage="This order does not contain any item details."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setViewOrderTarget(null)}>Close</Button></div>
            </div>
          )}
        </Modal>

        {activeTab === 'RECEIVE_STOCK' && (
          <Card>
            <CardHeader title="Receive dispatched stock manually" action={<span className="sales-builder-step">Outlet receipt</span>} />
            <CardContent style={{ padding: 0 }}>
              <p className="text-muted" style={{ margin: '1rem 1rem 0' }}>Select a dispatched load plan, enter only the quantities physically received, then confirm. Blank products remain on this page until received.</p>
              {receiptNotice && <div className="order-builder-alert order-builder-alert-success" style={{ margin: '1rem' }}>{receiptNotice}</div>}
              {ordersLoading ? (
                <div style={{ padding: '3rem 0' }}><LoadingState message="Loading dispatched stock..." /></div>
              ) : ordersError ? (
                <div style={{ padding: '1.5rem' }}><ErrorState error={ordersError} onRetry={() => setActiveTab('RECEIVE_STOCK')} /></div>
              ) : (
                <Table
                  columns={[
                    { key: 'displayId', label: 'Order', render: (row) => row.displayId || row.orderId },
                    { key: 'createdBy', label: 'Created by', render: (row) => row.createdByName || (row.createdBy ? 'Name unavailable' : 'Not recorded') },
                    { key: 'isCustomized', label: 'Order type', render: (row) => row.isCustomized ? 'Customized' : 'Standard' },
                    { key: 'dispatchedAt', label: 'Dispatched', render: (row) => row.dispatchedAt ? new Date(row.dispatchedAt).toLocaleString() : '—' },
                    { key: 'receiptItems', label: 'Pending products', align: 'center', render: (row) => row.receiptItems?.length || 0 },
                    { key: 'action', label: 'Action', render: (row) => <Button size="sm" onClick={() => openManualReceipt(row)}>Receive manually</Button> },
                  ]}
                  data={myOrders.flatMap(order => order.receiptPlans?.length ? order.receiptPlans.map(plan => ({...order,...plan, id:`${order.orderId}-${plan.loadPlanId}`})) : order.loadPlanId && order.receiptItems?.length ? [order] : [])}
                  emptyStateMessage="No dispatched products are awaiting receipt."
                />
              )}
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={Boolean(receiptTarget)}
          onClose={() => { if (!receivingStock) setReceiptTarget(null); }}
          title={`Receive stock — ${receiptTarget?.displayId || receiptTarget?.orderId || ''}`}
        >
          <p className="text-muted" style={{ marginTop: 0 }}>Enter quantities only for products that arrived now. Leave the other products blank.</p>
          {receiptError && <div className="order-builder-alert order-builder-alert-error">{receiptError}</div>}
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {(receiptTarget?.receiptItems || []).map((item) => (
              <div key={item.product_id} className="receipt-product-row">
                <div><strong>{item.productName || getProductName(item.product_id) || item.product_id}</strong><div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Pending: {item.remainingQty} of {item.quantity}</div><DispatchSources sources={item.dispatchSources} /></div>
                <Input label="Received now" type="number" min="1" max={item.remainingQty} placeholder="Leave blank" value={receiptQuantities[item.product_id] ?? ''} onChange={(event) => setReceiptQuantities((current) => ({ ...current, [item.product_id]: event.target.value }))} disabled={receivingStock} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setReceiptTarget(null)} disabled={receivingStock}>Cancel</Button>
            <Button onClick={submitManualReceipt} disabled={receivingStock}>{receivingStock ? 'Saving...' : 'Confirm receipt'}</Button>
          </div>
        </Modal>

        {activeTab === 'STOCK' && (
          <Card>
            <CardHeader title={isGodown ? "Current godown stock" : `Available Stock · ${stockDay}`} action={isGodown ? <Button variant="secondary" disabled={stockLoading} onClick={() => setStockReload(value => value + 1)}>Refresh current stock</Button> : <Button variant="secondary" disabled={stockLoading} onClick={()=>setStockReload(value=>value+1)}>Refresh today’s stock</Button>} />
            {isGodown && <div style={{padding:'1rem 1.5rem'}}><Select label="Stock display" value={godownStockView} onChange={event => setGodownStockView(event.target.value)} options={[{value:'CURRENT',label:'Current stock'},{value:'FLOW',label:'Stock flow details'}]} /><p>Current stock is the quantity physically remaining after dispatches. Available quantity excludes stock reserved for assigned orders. Temporary outlet goods are listed separately below.</p></div>}
            <CardContent style={{ padding: 0 }}>
              {stockLoading ? (
                <div style={{ padding: '3rem 0' }}>
                  <LoadingState message="Fetching live stock data..." />
                </div>
              ) : stockError ? (
                <div style={{ padding: '1.5rem' }}>
                  <ErrorState error={stockError} onRetry={() => setStockReload(value => value + 1)} />
                </div>
              ) : (
                <GroupedStockTable
                  catalogue={productOptions}
                  columns={!isGodown ? [
                    {key:'productName',label:'Product'},
                    {key:'mappedMrp',label:'MRP',render:row=><ProductMrp item={row} label={false}/>},
                    {key:'availableQty',label:'Available Quantity',render:row=>Math.max(0,Number(row.closingQty || 0)-Number(row.reservedQty || 0))},
                  ] : godownStockView === 'CURRENT' ? [
                    {key:'productName',label:'Product',render:row=>row.productName || 'Product name unavailable'},
                    {key:'mappedMrp',label:'MRP',render:row=><ProductMrp item={row} label={false}/>},
                    {key:'closingQty',label:'Current Stock',align:'center',render:row=>Number(row.closingQty || 0)},
                    {key:'reservedQty',label:'Reserved',align:'center',render:row=>Number(row.reservedQty || 0)},
                    {key:'availableQty',label:'Available to Dispatch',align:'center',render:row=>Number(row.availableQty ?? (Number(row.closingQty || 0)-Number(row.reservedQty || 0)))},
                    {key:'lastUpdated',label:'Last Updated',render:row=>row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—'},
                  ] : [
                    { key: 'productName', label: 'Product Name', render: (row) => row.productName || 'Product name unavailable' },
                    {key:'mappedMrp',label:'MRP',render:row=><ProductMrp item={row} label={false}/>},
                    { key: 'openingQty', label: 'Opening', align: 'center', render: (row) => row.openingQty || 0 },
                    { key: 'receivedQty', label: 'Received', align: 'center', render: (row) => row.receivedQty || 0 },
                    { key: 'soldQty', label: 'Sold', align: 'center', render: (row) => row.soldQty || 0 },
                    { key: 'transferOutQty', label: 'Transferred Out', align: 'center', render: row => row.transferOutQty || 0 },
                    { key: 'closingQty', label: 'Closing', align: 'center', render: (row) => row.closingQty || 0 },
                    { key: 'lastUpdated', label: isGodown?'Last Updated':'Stock Date', render: (row) => row.lastUpdated ? new Date(row.lastUpdated).toLocaleDateString() : '-' }
                  ]} 
                  data={isGodown?stockItems:stockItems.filter(row=>Number(row.closingQty || 0)-Number(row.reservedQty || 0)>0)}
                  emptyStateMessage="No tracked operational inventory found."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'STOCK' && isGodown && <GodownCustody stockView />}

        {activeTab === 'STOCK_IN' && isStall && <StallStockIn/>}
        {activeTab === 'SALES' && isGodown === false && (
          <Card className="sales-builder-card">
            <CardHeader title="Record daily sales" action={<span className="sales-builder-step">Sales entry</span>} />
            <CardContent className={`sales-builder-content${ownedShowroomSales ? ' compact-sales-entry' : ''}`}>
              <div className="sales-builder-intro">
                <div className="sales-builder-intro-icon"><Calendar size={20} /></div>
                <div><h3>Capture today’s sales</h3><p>Add each sold product, review the summary, then submit one complete record.</p></div>
              </div>
              
              {salesCatalogueStatus==='error' && <p role="alert">Product details could not load. Your sales draft is preserved. <Button onClick={()=>setStockReload(value=>value+1)}>Refresh products</Button></p>}
              {draftRecovered && <p role="status">Your unfinished sales entry was restored on this device. Review it before submitting.</p>}
              {draftStorageError && <p role="alert">Recovery draft could not be saved. Check browser storage before submitting.</p>}
              {pendingSale && <div role="alert" className="order-builder-alert order-builder-alert-error">This submission needs confirmation. Retry the saved bill before starting another sale. <Button disabled={isSubmittingSales} onClick={handleRecordSalesSubmit}>{isSubmittingSales?'Confirming…':'Retry saved submission'}</Button><small>Reference: {pendingSale.requestId}</small></div>}
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

              <div className="sales-keyboard-guide"><strong>Quick entry</strong><span>Enter: next field · Shift + Enter: previous · Tab: next control</span><small>Search products, use ↑ / ↓, then Enter to choose. Submit only after reviewing.</small></div>
              {salesValidationErrors.length>0 && <div ref={salesNoticeRef} role="alert" className="sales-missing-notice"><div><strong>Please check {salesValidationErrors.length===1?'this detail':'these details'}</strong><button type="button" onClick={()=>setSalesValidationErrors([])} aria-label="Dismiss sales notification">×</button></div><ul>{salesValidationErrors.map((message,index)=><li key={`${message}-${index}`}><button type="button" onClick={()=>focusSalesIssue(message)}>{message} <span>Go to field →</span></button></li>)}</ul></div>}
              <fieldset ref={salesFormRef} onChangeCapture={event=>{if(event.target.id)setSalesValidationErrors(current=>{const remaining=current.filter(message=>salesIssueTarget(message).id!==event.target.id);return remaining.length===current.length?current:remaining;});}} onKeyDown={salesKeyboard} disabled={isSubmittingSales || Boolean(pendingSale)} style={{border:0,padding:0,margin:0,minWidth:0}}>
              {editingSalesIndex!==null && <p role="status">Editing product {editingSalesIndex+1}. Update the product or cancel the edit before submitting.</p>}
              {ownedShowroomSales && <nav data-sales-keyboard-skip ref={salesStepTop} className="sales-entry-steps" aria-label="Sales entry steps">{['Products','Payment','Customer','Review'].map((title,index)=><button type="button" key={title} aria-current={salesEntryStep===index?'step':undefined} onClick={()=>navigateSalesStep(index)}><span>{index+1}</span>{title}</button>)}</nav>}
              {activeOffers.length > 0 && (!ownedShowroomSales || salesEntryStep===0) && (
                <section className="sales-builder-offers" aria-label="Current outlet offers">
                  <Gift size={19} />
                  <div><strong>Current outlet offers</strong><span>{activeOffers.map(offerSummary).join(' | ')}</span></div>
                </section>
              )}

              {ownedShowroomSales && (
                <div className="order-builder-alert order-builder-alert-info" hidden={salesEntryStep!==0}>
                  <strong>NIMMADHI Outlet — Customer delivery choice</strong><br />
                  Choose delivery for each product before adding it. You can sell a factory-supplied bed and outlet-stock pillows together on one invoice.
                </div>
              )}

              <div className={`sales-builder-workspace${ownedShowroomSales ? ` sales-builder-workspace--nim sales-step-${salesEntryStep}` : ''}`}>
                <section className="sales-builder-date-card" hidden={ownedShowroomSales && salesEntryStep!==1}>
                  <div className="order-builder-section-label"><span>1</span><div><strong>Sales date</strong><small>Choose the date for this entry</small></div></div>
                  <Input id="sale-date" error={salesFieldError('sale-date')} required type="date" label="Date of sale" value={salesDate} onChange={(e) => setSalesDate(e.target.value)} />
                  {ownedShowroomSales && <><Input label="Bill number (optional)" value={saleDetails.billNo} onChange={event => setSaleDetails({ ...saleDetails, billNo: event.target.value })} maxLength={80} /><Input id="sale-dispatch-date" error={salesFieldError('sale-dispatch-date')} required label="Dispatch date" type="date" value={saleDetails.dispatchDate} onChange={event => setSaleDetails({ ...saleDetails, dispatchDate: event.target.value })} /><p className="showroom-sale-hint">Work-order number is generated automatically when this sale is submitted.<br />Sales person: <strong>{loggedInEmployeeName || 'Recorded from your login'}</strong></p></>}
                </section>
                <section className="sales-builder-entry-card" ref={salesProductSelector} tabIndex={-1} hidden={ownedShowroomSales && salesEntryStep!==0} style={{scrollMarginTop:'7rem'}}>
                  <div className="order-builder-section-label"><span>1</span><div><strong>Sold product</strong><small>{ownedShowroomSales ? 'Choose products and their delivery source' : 'Only products available at this outlet are listed'}</small></div></div>
                  <GroupedProductPicker searchAll label="Sale product" options={salesProductOptions.map(option=>option.value ? {...option,label:`${option.label} — ${isStall?(salesFulfillmentMode==='LINKED_OUTLET_STOCK'?'Linked outlet stock':'Stall stock'):'Outlet stock'}: ${availableStockLabel(option.value)}`} : option)} value={salesProduct} onChange={val => { setSalesProduct(val); setShowroomItem(current => showroomItemForProduct(current, salesProductOptions.find(option => option.value === val))); setSalesValidationErrors([]);if(val)requestAnimationFrame(()=>document.getElementById(ownedShowroomSales?'sale-delivery-source':'sale-quantity')?.focus()); }} placeholder={isStall?'Search products and stock…':'Search products and outlet stock…'} />
                  {salesProduct && <div role="status" className="sales-product-mrp" style={{padding:'0.75rem 1rem',marginBottom:'1rem',border:'1px solid var(--color-primary)',borderRadius:'0.75rem'}}><strong>Product MRP</strong><ProductMrp item={salesProductOptions.find(option=>option.value===salesProduct) || {productId:salesProduct}} label={false}/></div>}
                  {ownedShowroomSales && salesProduct && <Select id="sale-delivery-source" error={salesFieldError('sale-delivery-source')} required label="Delivery source for this product" value={salesFulfillmentMode} onChange={e => setSalesFulfillmentMode(e.target.value)} options={[{value:'',label:'Choose delivery option'},{value:'LOCAL_STOCK',label:isStall?'Move from stall stock':'Needed immediately — deliver from outlet stock'},...(isStall?[{value:'LINKED_OUTLET_STOCK',label:'Move from linked outlet stock'}]:[]),{value:'FACTORY_DELIVERY',label:'Factory dispatch directly to customer'}]} />}
                  {ownedShowroomSales && salesProduct && <ShowroomSaleFields fieldError={salesFieldError} isAccessory={Boolean(salesProductOptions.find(option=>option.value===salesProduct)?.isAccessory)} item={showroomItem} onChange={setShowroomItem} quantity={Number(salesQuantity)} />}
                  {salesProduct && <p role="status"><strong>{isStall && salesFulfillmentMode==='FACTORY_DELIVERY'?'Factory delivery — stall and linked outlet stock stay unchanged.':<>{isStall?(salesFulfillmentMode==='LINKED_OUTLET_STOCK'?'Available at linked outlet':'Available at stall'):'Available in this outlet'}: {availableStockLabel(salesProduct)}</>}</strong></p>}
                  {salesStockStatus==='error' && <Button variant="secondary" onClick={()=>setSalesStockRefresh(value=>value+1)}>Refresh outlet stock</Button>}
                  <div className="sales-builder-add-row">
                    <Input id="sale-quantity" error={salesFieldError('sale-quantity')} required label="Quantity sold" type="number" min="1" value={salesQuantity} onChange={(e) => setSalesQuantity(e.target.value)} />
                    <Button className="order-builder-add-button" onClick={handleAddSalesItem} disabled={isSubmittingSales}><Plus size={18} /> {editingSalesIndex!==null?'Update product':'Add sale'}</Button>
                    {editingSalesIndex!==null && <Button variant="secondary" onClick={cancelSalesEdit} disabled={isSubmittingSales}>Cancel edit</Button>}
                  </div>
                </section>
                {ownedShowroomSales && <section className="sales-builder-date-card sales-builder-customer-card" hidden={salesEntryStep!==1}>
                  <div className="order-builder-section-label"><span>2</span><div><strong>Cash and payment details</strong><small>Record the discount, payment, and balance</small></div></div>
                  <Select required id="sale-payment-method" error={salesFieldError('sale-payment-method')} label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[
                    {value:'',label:'Select a payment method'},
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'UPI', label: 'UPI' },{value:'SPLIT',label:'Split payment (Cash / UPI / Card)'},
                  ]} />
                  {ownedShowroomSales && <><Input id="sale-cash-discount" error={salesFieldError('sale-cash-discount')} label="Cash discount (₹)" type="number" min="0" step="0.01" placeholder="0.00" value={cashDiscount} onChange={e => setCashDiscount(e.target.value)} /><div className="sales-builder-payment-summary">Total after percentage discount: <strong>{formatCurrency(grossAmount)}</strong><br />Cash discount: <strong>− {formatCurrency(enteredDiscount)}</strong><br />Round-off: <strong>{formatCurrency(showroomBillPrice(grossAmount.toFixed(2), cashDiscount)?.roundOff ?? 0)}</strong><br />Grand total (tax included): <strong>{formatCurrency(netBillAmount)}</strong></div></>}
                  {paymentMethod==='SPLIT' && <PaymentSplitInput values={advanceSplit} onChange={setAdvanceSplit} onTotalChange={setAdvanceAmount} disabled={isSubmittingSales}/>}
                  <Input id="sale-advance" error={salesFieldError('sale-advance')} required readOnly={paymentMethod==='SPLIT'} label="Amount paid now (advance)" type="number" min="0" step="0.01" placeholder="0.00" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
                  {grossAmount > 0 && <div className="sales-builder-payment-summary">Balance due: <strong>{formatCurrency(Math.max(0, netBillAmount - Number(advanceAmount || 0)))}</strong></div>}
                </section>}
                {ownedShowroomSales && <section className="sales-builder-date-card sales-builder-customer-card" hidden={salesEntryStep!==2}>
                  <div className="order-builder-section-label"><span>3</span><div><strong>Customer details</strong><small>Customer details are required for NIM sales</small></div></div>
                  <Input id="sale-customer-name" error={salesFieldError('sale-customer-name')} required label="Customer name" placeholder="e.g. S. Kumar" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <Input id="sale-customer-phone" error={salesFieldError('sale-customer-phone')} required label="Customer phone number" type="tel" placeholder="e.g. 9876543210" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  <Input id="sale-customer-address" error={salesFieldError('sale-customer-address')} required label="Customer address" placeholder="House, street, area, city" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />

                </section>}
              </div>

              <div className="order-builder-summary" hidden={ownedShowroomSales && salesEntryStep!==3}>
                <div className="order-builder-summary-heading"><PackageSearch size={19} /><div><h4>Sales summary</h4><span>{salesItems.length} {salesItems.length === 1 ? 'product' : 'products'} added</span></div></div>
                {salesItems.length === 0 ? (
                  <div className="order-builder-empty">
                    Add sold products to prepare today’s sales record.
                  </div>
                ) : (
                  <div className="order-builder-items">
                    {salesItems.map((item, idx) => (
                      <div key={idx} className="order-builder-item sales-summary-item">
                        <span className="order-builder-item-quantity" style={{width:'auto',minWidth:'4rem',padding:'.5rem',flexDirection:'column'}}>{item.quantity}<small style={{display:'block',fontSize:'.75rem',fontWeight:400,marginTop:'.35rem'}}>{isStall?(item.fulfillmentMode==='LINKED_OUTLET_STOCK'?'Linked outlet stock':'Stall stock'):'Outlet stock'}: {availableStockLabel(item.product_id,item.fulfillmentMode)}</small></span>
                        <span className="order-builder-item-name">{saleProductName(salesProductOptions.find(o => o.value === item.product_id)?.label || item.product_id,item.size)}<ProductMrp item={item}/>{ownedShowroomSales && <span className="showroom-item-details">{item.brand} · {item.colour} · {item.size}<br />MRP {formatCurrency(Number(item.mrpSticker))} − {formatCurrency(showroomPrice(item)?.discountAmount || 0)} ({showroomPrice(item)?.discountPercent ?? item.discountPercent}%) · Unit {formatCurrency(showroomPrice(item)?.value || 0)}<br /><strong>Delivery: {item.fulfillmentMode === 'LOCAL_STOCK' ? (isStall?'Stall stock → customer':'Outlet stock → customer') : item.fulfillmentMode==='LINKED_OUTLET_STOCK'?'Linked outlet → customer':'Factory → customer'}</strong><br /><strong>Total {formatCurrency(showroomPrice(item)?.totalSalesValue || 0)}</strong> · Tax included ({item.taxPercent}%){item.scheme && <><br />Scheme: {item.scheme}</>}</span>}</span>
                        <div className="sales-summary-actions"><Button variant="secondary" onClick={()=>editSalesItem(idx)} disabled={isSubmittingSales || editingSalesIndex!==null} aria-label={`Edit sales product ${idx+1}`}>Edit product</Button>
                        <Button variant="secondary" className="order-builder-remove" onClick={() => removeSalesItem(idx)} disabled={isSubmittingSales || editingSalesIndex!==null} aria-label="Remove sales item">
                          <Trash2 size={16} />
                        </Button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {ownedShowroomSales && salesEntryStep===3 && <SalesEntryReview items={salesItems} gross={grossAmount} cashDiscount={cashDiscount} received={advanceAmount} paymentMethod={paymentMethod} split={advanceSplit} customerName={customerName} customerPhone={customerPhone} customerAddress={customerAddress} date={salesDate} details={saleDetails} salesPerson={loggedInEmployeeName} onEdit={goToSalesStep}/>}
              {ownedShowroomSales && <div className="sales-step-footer"><span><strong>{salesItems.length} products</strong> · Total {formatCurrency(netBillAmount)}</span><div>{salesEntryStep>0 && <Button data-sales-keyboard-skip variant="secondary" onClick={()=>goToSalesStep(salesEntryStep-1)}>Back</Button>}{salesEntryStep<3 && <Button disabled={editingSalesIndex!==null || (salesEntryStep===0 && !salesItems.length)} onClick={()=>navigateSalesStep(salesEntryStep+1)}>Continue to {['Payment','Customer','Review'][salesEntryStep]}</Button>}</div></div>}
              <Button hidden={ownedShowroomSales && salesEntryStep!==3} className="order-builder-submit" onClick={handleRecordSalesSubmit} disabled={isSubmittingSales || editingSalesIndex!==null}>
                <ShoppingBag size={18} /> {isSubmittingSales ? 'Recording sales…' : 'Submit sales record'}
              </Button>
            </fieldset>
            </CardContent>
          </Card>
        )}

        <Modal isOpen={showReportPending} onClose={()=>setShowReportPending(false)} title="Pending payments to receive">
          <p>Outstanding balances on invoices in the selected report period and payment-method filter. Amounts reflect the latest recorded payments.</p>
          <Table columns={[
            {key:'customerName',label:'Customer',render:r=><div><strong>{r.customerName || 'Not recorded'}</strong><br/>{r.customerPhone}<br/>{r.customerAddress}</div>},
            {key:'billNo',label:'Invoice / Work order',render:r=><div>{r.billNo || r.saleReferenceId || r.saleId}<br/>{r.workOrderNo || ''}<br/>{r.saleTimestamp ? new Date(r.saleTimestamp).toLocaleDateString() : ''}</div>},
            {key:'products',label:'Products',render:r=><div>{(r.products || []).map((p,i)=><div key={i}>{p.productName} × {p.quantity}</div>)}</div>},
            {key:'paymentMethod',label:'Payment method'},
            {key:'billAmount',label:'Bill total',render:r=>formatCurrency(Number(r.billAmount || 0))},
            {key:'amountReceived',label:'Received',render:r=>formatCurrency(Number(r.amountReceived || 0))},
            {key:'pendingAmount',label:'Pending',render:r=><strong>{formatCurrency(Number(r.pendingAmount || 0))}</strong>},
            {key:'actions',label:'Action',render:r=><Button onClick={()=>openSettlement(r)}>Receive payment</Button>},
          ]} data={reportData?.pendingPayments || []} emptyStateMessage="No pending payments for this report."/>
        </Modal>

        {activeTab === 'DUE_CUSTOMERS' && isGodown === false && (
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
                    ...(ownedShowroomSales ? [{ key: 'customerName', label: 'Customer' },
                    { key: 'customerPhone', label: 'Phone' },
                    { key: 'customerAddress', label: 'Address', render: (row) => row.customerAddress || '-' }] : []),
                    { key: 'products', label: 'Products', render: (row) => (
                      <div className="pending-payment-products">
                        {(row.products || []).map((product) => (
                          <div key={product.productId || product.productName}>
                            {product.productName || product.productId}<ProductMrp item={product}/> <strong>× {product.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    ) },
                    { key: 'saleDate', label: 'Invoice date', render: (row) => row.saleDate ? new Date(row.saleDate).toLocaleDateString() : '-' },
                    { key: 'billAmount', label: 'Bill', align: 'right', render: (row) => formatCurrency(row.billAmount) },
                    { key: 'advanceAmount', label: 'Paid', align: 'right', render: (row) => formatCurrency(row.advanceAmount) },
                    { key: 'balanceDue', label: 'Balance due', align: 'right', render: (row) => <strong>{formatCurrency(row.balanceDue)}</strong> },
                    { key: 'action', label: 'Action', align: 'right', render: (row) => <Button onClick={() => openSettlement(row)}>Record payment</Button> },
                  ]}
                  data={dueCustomers}
                  emptyStateMessage="No pending customer payments for this outlet."
                />
              )}
            </CardContent>
          </Card>
        )}

        <Modal className="sales-invoice-dialog" isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} title="Sales invoice">
          {receipt && (
            <SalesBill receipt={receipt} offerSummary={offerSummary}/>
          )}
        </Modal>

      <Modal isOpen={Boolean(paymentTarget)} onClose={() => !settlingPayment && setPaymentTarget(null)} title={`Record pending payment — ${paymentTarget?.customerName || ''}`}>
          {paymentTarget && <div className="sales-builder-content" style={{ display: 'grid', gap: '1rem' }}>
            <p className="text-muted">Invoice <strong>{paymentTarget.saleReferenceId}</strong> · Balance due: <strong>{formatCurrency(paymentTarget.balanceDue)}</strong></p>
            <Select label="Payment method" value={settlementMethod} onChange={(event) => setSettlementMethod(event.target.value)} disabled={settlingPayment} options={[{value:'',label:'Choose Cash / UPI / Card'},{ value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' }, { value: 'UPI', label: 'UPI' },{value:'SPLIT',label:'Split payment'}]} />
            {settlementMethod==='SPLIT' && <PaymentSplitInput values={settlementSplit} onChange={setSettlementSplit} onTotalChange={setSettlementAmount} disabled={settlingPayment}/>}
            <Input readOnly={settlementMethod==='SPLIT'} label="Amount paid now" type="number" min="0.01" max={paymentTarget.balanceDue} step="0.01" value={settlementAmount} onChange={(event) => setSettlementAmount(event.target.value)} />
            {settlementError && <div className="order-builder-alert order-builder-alert-error">{settlementError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}><Button variant="secondary" onClick={() => setPaymentTarget(null)} disabled={settlingPayment}>Cancel</Button><Button onClick={confirmSettlement} disabled={settlingPayment || !settlementMethod}>{settlingPayment ? 'Saving…' : 'Confirm payment & bill'}</Button></div>
          </div>}
        </Modal>

        {activeTab === 'REPORTS' && isGodown && <GodownReports />}
        {activeTab === 'REPORTS' && isGodown === false && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {isStall || reportView==='stock' ? <StockMovementReport outletId={outletId} catalogue={productOptions} onBack={isStall?undefined:()=>setReportView('list')}/> : reportView === 'list' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <Card><CardContent><h3>Stock Movement Report</h3><p>Date-wise opening, received, sold, transferred-out and closing stock.</p><Button onClick={()=>setReportView('stock')}>Open stock report</Button></CardContent></Card>
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
                    <Select label="Payment method" value={reportPaymentMethod} disabled={isGenerating || isDownloading} onChange={event=>{const method=event.target.value;setReportPaymentMethod(method);setReportData(null);handleGenerateReport(method);}} options={[{value:'ALL',label:'All payment methods'},{value:'CASH',label:'Cash'},{value:'UPI',label:'UPI'},{value:'CARD',label:'Card'}]} />
                    <Button variant="secondary" onClick={handleDownloadReport} disabled={isDownloading} style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#0f766e', border: 'none' }}>
                      {isDownloading ? 'Downloading...' : 'Download Excel'}
                    </Button>
                    <Button onClick={()=>handleGenerateReport()} disabled={isGenerating} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
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
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>{ownedShowroomSales ? 'Total invoices' : 'Total Sales / Transactions'}</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{ownedShowroomSales ? reportInvoices(reportData.sales || reportData.items || []).length : (reportData.totalSales ?? reportData.totalTransactions ?? reportData.totalOrders ?? 0)}</p>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Units Sold / Processed</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{reportData.totalQuantity ?? reportData.totalUnits ?? reportData.totalQty ?? 0}</p>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Revenue Value</p>
                            <small>{reportData.paymentMethod === 'ALL' ? 'All payment methods' : reportData.paymentMethod}</small><p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)' }}>₹{(reportData.totalAmount || reportData.totalRevenue || reportData.revenue || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
                          <div style={{padding:'1.25rem',border:'1px solid var(--color-green)',borderRadius:'10px'}}><h4 style={{margin:'0 0 .5rem'}}>Amount received</h4><strong style={{fontSize:'1.75rem'}}>{formatCurrency(Number(reportData.amountReceived || 0))}</strong><p>Money received against invoices in this report. Unpaid amounts excluded.</p><PaymentBreakdown amounts={reportData.receivedByMethod}/>{reportData.paymentMethod!=='ALL' && <small>Received total includes only the selected method. Invoice values and outstanding balances remain whole invoice amounts.</small>}</div>
                          <button type="button" onClick={()=>setShowReportPending(true)} style={{padding:'1.25rem',border:'1px solid var(--color-primary)',borderRadius:'10px',background:'var(--color-secondary)',color:'var(--color-text)',textAlign:'left',cursor:'pointer'}}><h4 style={{margin:'0 0 .5rem'}}>Pending to receive</h4><strong style={{fontSize:'1.75rem'}}>{formatCurrency(Number(reportData.pendingAmount || 0))}</strong><p>{reportData.pendingPayments?.length || 0} outstanding invoices · View pending payments</p></button>
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
                            {ownedShowroomSales ? <InvoiceSalesReport rows={reportData.items || reportData.sales || reportData.products || reportData.data} complimentarySummary={complimentarySummary}/> : (
                            <Table 
                              columns={[
                                { key: 'id', label: 'S.No', render: (row, i) => (i !== undefined ? i + 1 : '-') },
                                { key: 'product', label: 'Product Name', render: (row) => row.productName || row.product_name || getProductName(row.productId || row.product_id || row.name) },
                                ...(ownedShowroomSales ? [
                                  { key: 'workOrderNo', label: 'Work order', render: row => row.workOrderNo || '—' },
                                  { key: 'billNo', label: 'Bill no.', render: row => row.billNo || '—' },
                                  { key: 'dispatchDate', label: 'Planned dispatch', render: row => row.dispatchDate || '—' },
                                  ...(ownedShowroomSales ? [{ key: 'customerName', label: 'Customer' }, { key: 'customerAddress', label: 'Address' }, { key: 'customerPhone', label: 'Phone' }] : []),
                                  { key: 'brand', label: 'Brand' }, { key: 'model', label: 'Model' }, { key: 'colour', label: 'Colour' }, { key: 'size', label: 'Size' },
                                  { key: 'mrpSticker', label: 'Sticker MRP', render: row => row.mrpSticker != null ? formatCurrency(Number(row.mrpSticker)) : '—' },
                                  { key: 'discountPercent', label: 'Discount', render: row => row.discountPercent != null ? `${row.discountPercent}%` : '—' },
                                  { key: 'value', label: 'Value', render: row => row.value != null ? formatCurrency(Number(row.value)) : '—' },
                                  { key: 'cashDiscount', label: 'Cash discount', render: row => formatCurrency(Number(row.cashDiscount || 0)) },
                                  { key: 'billAmount', label: 'Grand total', render: row => formatCurrency(Number(row.billAmount || 0)) },
                                  { key: 'scheme', label: 'Scheme', render: row => row.scheme || '—' },
                                  { key: 'taxPercent', label: 'Included tax', render: row => row.taxPercent != null ? `${row.taxPercent}%` : '—' },
                                  { key: 'createdByName', label: 'Sales person', render: row => row.createdByName || 'Not recorded' },
                                ] : []),
                                {key:'paymentMethod',label:'Payment method',render:row=>row.paymentMethod || 'Not recorded'},
                                { key: 'total_qty', label: 'Total Qty', align: 'center', render: (row) => row.totalQty ?? row.total_qty ?? row.quantity ?? 0 },
                                { key: 'complimentary', label: 'Complimentary', render: (row) => complimentarySummary(row.eligibleOffers) },
                                { key: 'amount', label: 'Amount', align: 'right', render: (row) => row.amount || row.totalAmount || row.revenue ? `₹${Number(row.amount || row.totalAmount || row.revenue).toLocaleString()}` : '-' },
                                { key: 'date', label: 'Date', render: (row) => (row.saleTimestamp || row.saleDate || row.date) ? new Date(row.saleTimestamp || row.saleDate || row.date).toLocaleDateString() : '-' }
                              ]}
                              data={reportData.items || reportData.sales || reportData.products || reportData.data}
                            />)}
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
          <Select label="Salary payment method" value={empBank.salaryPaymentMethod} onChange={e=>setEmpBank({...empBank,salaryPaymentMethod:e.target.value})} options={[{value:'BANK',label:'Bank transfer'},{value:'CASH',label:'Cash'}]} disabled={isSubmittingEmployee} />
          {empBank.salaryPaymentMethod === 'BANK' && <>
          <Input label="Bank account number" type="text" inputMode="numeric" value={empBank.bankAccountNumber} onChange={e => setEmpBank({...empBank, bankAccountNumber: e.target.value})} disabled={isSubmittingEmployee} />
          <Input label="IFSC code" value={empBank.ifscCode} onChange={e => setEmpBank({...empBank, ifscCode: e.target.value.toUpperCase()})} disabled={isSubmittingEmployee} />
          <Input label="Bank name" value={empBank.bankName} onChange={e => setEmpBank({...empBank, bankName: e.target.value})} disabled={isSubmittingEmployee} />
          <Input label="Bank branch" value={empBank.bankBranch} onChange={e => setEmpBank({...empBank, bankBranch: e.target.value})} disabled={isSubmittingEmployee} />
          </>}
          <Input label="Monthly ESI & PF amount (₹)" type="number" min="0" step="0.01" value={empMonthlyEsiPfAmount} onChange={e => setEmpMonthlyEsiPfAmount(e.target.value)} disabled={isSubmittingEmployee} />
          <Input label="Monthly travel allowance (₹)" type="number" min="0" step="0.01" value={empMonthlyTravelAllowance} onChange={e => setEmpMonthlyTravelAllowance(e.target.value)} disabled={isSubmittingEmployee} />
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

          <Select label="Salary payment method" value={configBank.salaryPaymentMethod} onChange={e=>setConfigBank({...configBank,salaryPaymentMethod:e.target.value})} options={[{value:'BANK',label:'Bank transfer'},{value:'CASH',label:'Cash'}]} disabled={isSavingSalaryConfig} />
          {configBank.salaryPaymentMethod === 'BANK' && <>
          <Input label="Bank account number" type="text" inputMode="numeric" value={configBank.bankAccountNumber} onChange={e => setConfigBank({...configBank, bankAccountNumber: e.target.value})} disabled={isSavingSalaryConfig} />
          <Input label="IFSC code" value={configBank.ifscCode} onChange={e => setConfigBank({...configBank, ifscCode: e.target.value.toUpperCase()})} disabled={isSavingSalaryConfig} />
          <Input label="Bank name" value={configBank.bankName} onChange={e => setConfigBank({...configBank, bankName: e.target.value})} disabled={isSavingSalaryConfig} />
          <Input label="Bank branch" value={configBank.bankBranch} onChange={e => setConfigBank({...configBank, bankBranch: e.target.value})} disabled={isSavingSalaryConfig} />
          </>}
          <Input label="Monthly ESI & PF amount (₹)" type="number" min="0" step="0.01" value={configMonthlyEsiPfAmount} onChange={e => setConfigMonthlyEsiPfAmount(e.target.value)} disabled={isSavingSalaryConfig} />
          <Input label="Monthly travel allowance (₹)" type="number" min="0" step="0.01" value={configMonthlyTravelAllowance} onChange={e => setConfigMonthlyTravelAllowance(e.target.value)} disabled={isSavingSalaryConfig} />
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
