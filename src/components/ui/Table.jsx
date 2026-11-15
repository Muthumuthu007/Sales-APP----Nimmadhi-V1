import GroupedStockTable from '../GroupedStockTable';
import ProductMrp from '../ProductMrp';
import {MrpColumnContext} from '../../context/ProductMrpContext';
import React from 'react';
import { EmptyState } from './StateContainers';
import './Table.css';

export const Table = ({ columns, data, onRowClick, emptyStateMessage = "No records found.", className = '', hierarchy = true }) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyStateMessage} />;
  }

  const productColumn=columns.findIndex(col=>['productName','product_name','product','products'].includes(col.key) || (col.key==='name' && data.some(row=>row.product_id || row.productId)));
  if(hierarchy && productColumn>=0 && data.some(row=>row.productId || row.product_id || row.baseProductId))return <GroupedStockTable data={data} onRowClick={onRowClick} className={className} columns={columns.map(col=>col.render?{...col,render:row=>col.render(row,data.indexOf(row))}:col)} emptyStateMessage={emptyStateMessage}/>;
  const hasMrp=columns.some(col=>/mrp/i.test(`${col.key} ${col.label}`));
  const displayColumns=[...columns];
  if(productColumn>=0 && !hasMrp)displayColumns.splice(productColumn+1,0,{key:'mappedMrp',label:'MRP',className:'mrp-column',render:row=>{
    const items=row.items?.length?row.items:row.products?.length && typeof row.products[0]==='object'?row.products:[row];
    return items.map((item,index)=><ProductMrp key={index} item={item} label={items.length>1}/>);
  }});
  return (
    <MrpColumnContext.Provider value={productColumn>=0 || hasMrp}><div className="table-container">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {displayColumns.map((col, index) => (
              <th scope="col" key={index} className={`${col.align || 'left'} ${col.className || ''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {displayColumns.map((col, colIndex) => (
                <td key={colIndex} data-label={typeof col.label === 'string' ? col.label : col.key} className={`${col.align || 'left'} ${col.className || ''} ${colIndex === productColumn || /actions?|complimentary|products|items|description/i.test(col.key) ? 'table-cell--wide' : ''}`}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div></MrpColumnContext.Provider>
  );
};
